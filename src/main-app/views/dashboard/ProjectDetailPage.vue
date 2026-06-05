<template>
  <DashboardLayout>
    <div class="detail-page">

      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-left">
          <a class="text-body-m detail-back-link" @click="goBack">&lt;</a>
          <span class="text-body-s detail-meta-link" @click="goBack">{{ backLabel }}</span>
        </div>
        <div v-if="project" class="detail-header-right">
          <div class="detail-nav-buttons">
            <Btn variant="icon" class="detail-nav-btn" title="First" :disabled="navigating || currentPosition <= 0" @click="goFirst"><ChevronsLeftIcon class="detail-nav-icon" /></Btn>
            <Btn variant="icon" class="detail-nav-btn" title="Previous" :disabled="navigating || currentPosition <= 0" @click="goPrev"><TriangleLeftIcon class="detail-nav-icon" /></Btn>
            <span class="text-body-s detail-position">
              <Spinner v-if="navigating" :size="18" class="detail-nav-spinner" />
              {{ currentPosition + 1 }} of {{ totalItems }}
            </span>
            <Btn variant="icon" class="detail-nav-btn" title="Next" :disabled="navigating || currentPosition >= totalItems - 1" @click="goNext"><TriangleRightIcon class="detail-nav-icon" /></Btn>
            <Btn variant="icon" class="detail-nav-btn" title="Last" :disabled="navigating || currentPosition >= totalItems - 1" @click="goLast"><ChevronsRightIcon class="detail-nav-icon" /></Btn>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="pageLoading" class="detail-loading">
        <Spinner />
      </div>

      <!-- Not found state -->
      <div v-else-if="notFound" class="detail-not-found">
        <EmptyState
            :icon="ProjectsIcon"
            title="This project is no longer available"
            text="It may have been completed, deleted, or moved to trash."
            buttonText="Go to Projects"
            @action="goToProjects"
        />
      </div>

      <!-- Content -->
      <div v-else-if="project" ref="detailBodyRef" class="detail-body" :class="{ scrolling: bodyScrolling }">

        <!-- Title area -->
        <div class="detail-title-area">
          <ProjectsIcon class="detail-type-icon" />
          <div class="detail-title-wrapper">
            <div v-if="savingField === 'title'" class="detail-section-overlay">
              <Spinner />
            </div>
            <h2
                class="text-h2 detail-title"
                :class="{ 'detail-title--hidden': editingField === 'title', 'detail-title--completed': isCompleted, 'detail-title--readonly': !isOwner }"
                @click="isOwner && startEdit('title', project.title)"
            >{{ project.title }}</h2>
            <textarea
                v-if="editingField === 'title'"
                ref="titleInput"
                v-model="editValue"
                class="text-h2 detail-title-input"
                :disabled="savingField === 'title'"
                @keydown.enter.prevent="saveField('title')"
                @keyup.esc="cancelEdit"
                @blur="saveField('title')"
                @input="autoResizeTitle"
                rows="1"
            ></textarea>
          </div>
          <Badge v-if="isShared" type="primary" label="Shared" class="detail-shared-badge" />
        </div>

        <!-- Action buttons -->
        <div class="detail-actions">
          <template v-if="isCompleted">
            <Btn
                variant="primary"
                size="sm"
                :loading="actionLoading === 'undo'"
                @click="onUndo"
            >
              Undo
            </Btn>
          </template>
          <template v-else-if="isSomeday">
            <Btn
                variant="primary"
                size="sm"
                :loading="actionLoading === 'activate'"
                @click="onActivate"
            >
              Activate
            </Btn>
            <Btn
                variant="secondary"
                size="sm"
                :loading="actionLoading === 'complete'"
                @click="onComplete"
            >
              Complete
            </Btn>
          </template>
          <template v-else>
            <Btn
                v-if="!isShared || isOwner"
                variant="secondary"
                size="sm"
                :loading="actionLoading === 'complete'"
                @click="onComplete"
            >
              Complete
            </Btn>
          </template>
          <Dropdown v-if="!isCompleted && !isShared" v-model="showMoveDialog" title="Move to">
            <template #trigger>
              <Btn
                  variant="secondary"
                  size="sm"
                  :loading="actionLoading === 'move'"
              >
                Move
              </Btn>
            </template>
            <button class="dropdown-item" @click="onMoveTo('ACTION')"><NextIcon class="dropdown-item-icon" /> Next Actions</button>
            <button class="dropdown-item" @click="onMoveTo('REFERENCE')"><ReferenceIcon class="dropdown-item-icon" /> Reference</button>
            <button v-if="!isSomeday" class="dropdown-item" @click="onMoveTo('SOMEDAY')"><SomedayIcon class="dropdown-item-icon" /> Someday</button>
          </Dropdown>
          <Btn
              v-if="!isCompleted && !isShared && isOwner"
              variant="secondary"
              size="sm"
              :loading="actionLoading === 'share'"
              @click="openShareModal('share')"
          >
            Share…
          </Btn>
          <Btn
              v-if="!isCompleted && isShared && !isOwner"
              variant="ghost-danger"
              size="sm"
              :loading="actionLoading === 'leave'"
              @click="onLeaveProject"
          >
            Leave
          </Btn>
          <Btn
              v-else-if="!isCompleted"
              variant="ghost-danger"
              size="sm"
              :loading="actionLoading === 'trash'"
              @click="onTrash"
          >
            Trash
          </Btn>
        </div>

        <!-- Outcome area -->
        <div class="detail-section-area detail-section-area--no-border">
          <label class="text-body-s fw-semibold detail-section-label">Outcome</label>
          <div class="detail-section-wrapper">
            <p
                v-if="editingField !== 'outcome'"
                class="text-body-m detail-section-content"
                :class="{ 'detail-section-content--empty': !project.outcome, 'detail-section-content--readonly': !isOwner }"
                @click="isOwner && startEdit('outcome', project.outcome || '')"
            >{{ project.outcome || (isOwner ? 'What does done look like?' : '—') }}</p>
            <textarea
                v-else
                ref="outcomeInput"
                v-model="editValue"
                class="text-body-m detail-section-textarea"
                :disabled="savingField === 'outcome'"
                @keyup.esc="cancelEdit"
                @blur="saveField('outcome')"
                rows="1"
            ></textarea>
            <div v-if="editingField === 'outcome'" class="detail-section-actions">
              <Btn
                  variant="primary"
                  size="sm"
                  :disabled="savingField === 'outcome'"
                  :loading="savingField === 'outcome'"
                  @mousedown.prevent
                  @click="saveField('outcome')"
              >Save</Btn>
              <Btn
                  variant="secondary"
                  size="sm"
                  :disabled="savingField === 'outcome'"
                  @mousedown.prevent
                  @click="cancelEdit"
              >Cancel</Btn>
            </div>
          </div>
        </div>

        <!-- Personal project: Next Action section -->
        <div v-if="!isCompleted && !isShared" class="detail-section-area">
          <label class="text-body-s fw-semibold detail-section-label">Next Action</label>
          <div class="next-action-wrapper">
            <div v-if="actionsLoading" class="next-action-loading">
              <Spinner :size="16" />
            </div>
            <template v-else>
              <!-- Add input at top (visible when items exist or user clicked warning) -->
              <div v-if="orderedActions.length > 0 || addInputVisible" class="actions-quick-add actions-quick-add--top">
                <input
                    ref="quickAddInput"
                    v-model="newActionTitle"
                    class="text-body-m actions-quick-add-input"
                    type="text"
                    placeholder="Add action..."
                    :disabled="addingAction"
                    @keydown.enter="onAddAction"
                    @blur="onAddInputBlur"
                />
                <Btn
                    variant="primary"
                    size="sm"
                    class="actions-quick-add-btn"
                    :disabled="!newActionTitle.trim() || addingAction"
                    :loading="addingAction"
                    @mousedown.prevent
                    @click="onAddAction"
                >Add</Btn>
              </div>

              <!-- Warning when no actions -->
              <div v-if="orderedActions.length === 0 && !isSomeday && !addInputVisible" class="next-action-prompt" @click="focusAddInput">
                <WarningIcon class="next-action-prompt__icon" />
                <div class="next-action-prompt__text">
                  <strong class="text-body-m fw-bold">What's the next physical step?</strong>
                  <span class="text-body-s">Every active project needs a next action.</span>
                </div>
              </div>

              <!-- Action list -->
              <div v-if="orderedActions.length > 0" ref="actionsScrollRef" class="actions-list-scroll" :class="{ scrolling: listScrolling }">
                <VueDraggable
                    v-model="orderedActions"
                    :delay="150"
                    :delay-on-touch-only="true"
                    :animation="150"
                    chosen-class="action-wrapper--chosen"
                    ghost-class="action-wrapper--ghost"
                    @end="onBacklogReorder"
                >
                  <div
                      v-for="action in orderedActions"
                      :key="action.id"
                      class="action-wrapper"
                  >
                    <div class="action-row">
                      <Item
                          :id="action.id"
                          :title="action.title"
                          :loading="completingActionId === action.id"
                          @update="onActionUpdate"
                          @check="() => onCompleteAction(action)"
                          @click="goToActionDetail(action)"
                      >
                        <template #actions>
                          <ActionBtn variant="danger" :loading="trashingActionId === action.id" @click="onTrashAction(action)">✕</ActionBtn>
                        </template>
                      </Item>
                      <a v-if="action.state !== 'BACKLOG'" class="text-footnote action-state-link" @click.stop="goToActionList(action.state)">{{ actionStateLabel(action.state) }}</a>
                    </div>
                  </div>
                </VueDraggable>
              </div>
            </template>
          </div>
        </div>

        <!-- Shared project: single flat list of all actions with assignee chip per row -->
        <div v-if="!isCompleted && isShared" class="detail-section-area">
          <!-- Non-Team read-only notice -->
          <div v-if="myTier !== 'team'" class="shared-readonly-notice">
            <p class="text-body-s shared-readonly-text">
              You're not on the Team plan, so you have read-only access to this shared project. Upgrade to Team to assign actions and edit.
            </p>
            <Btn variant="primary" size="sm" @click="openSharedUpgrade">Upgrade to Team</Btn>
          </div>
          <label class="text-body-s fw-semibold detail-section-label">Backlog</label>
          <div class="next-action-wrapper">
            <div v-if="actionsLoading" class="next-action-loading">
              <Spinner :size="16" />
            </div>
            <template v-else>
              <!-- Add input (write members only) -->
              <div v-if="canWrite && (orderedActions.length > 0 || addInputVisible)" class="actions-quick-add actions-quick-add--top">
                <input
                    ref="quickAddInput"
                    v-model="newActionTitle"
                    class="text-body-m actions-quick-add-input"
                    type="text"
                    placeholder="Add action..."
                    :disabled="addingAction"
                    @keydown.enter="onAddAction"
                    @blur="onAddInputBlur"
                />
                <Btn
                    variant="primary"
                    size="sm"
                    class="actions-quick-add-btn"
                    :disabled="!newActionTitle.trim() || addingAction"
                    :loading="addingAction"
                    @mousedown.prevent
                    @click="onAddAction"
                >Add</Btn>
              </div>

              <!-- Empty hint -->
              <p v-if="orderedActions.length === 0 && !addInputVisible" class="text-body-s detail-section-content detail-section-content--empty">
                <template v-if="canWrite"><a class="action-state-link" @click="focusAddInput">Add the first action</a></template>
                <template v-else>No actions yet.</template>
              </p>

              <!-- All actions list -->
              <div v-if="orderedActions.length > 0" class="actions-list-scroll">
                <VueDraggable
                    v-model="orderedActions"
                    :delay="150"
                    :delay-on-touch-only="true"
                    :animation="150"
                    :disabled="!canWrite"
                    chosen-class="action-wrapper--chosen"
                    ghost-class="action-wrapper--ghost"
                    @end="onBacklogReorder"
                >
                  <div
                      v-for="action in orderedActions"
                      :key="action.id"
                      class="action-wrapper shared-action-wrapper"
                  >
                    <div class="action-row">
                      <Item
                          :id="action.id"
                          :title="action.title"
                          :loading="completingActionId === action.id"
                          :no-checkbox="!canCompleteAction(action)"
                          :reserve-checkbox="true"
                          :editable="canWrite && (!action.assigned_to || isAssignedToMe(action))"
                          @update="onActionUpdate"
                          @check="() => onCompleteAction(action)"
                          @click="goToActionDetail(action)"
                      >
                        <template #actions>
                          <span v-if="action.assigned_to && !isAssignedToMe(action)" class="text-body-s action-assignee-right">
                            <template v-if="action.state === 'WAITING'">Waiting</template>
                            <template v-else>{{ assigneeLabel(action) }}</template>
                          </span>
                          <span v-if="isAssignedToMe(action)" class="text-body-s action-assignee-self">You</span>
                          <span v-if="hasActionButtons(action)" class="action-row-buttons">
                            <button
                                v-if="canWrite && !action.assigned_to && !myAssignedAction"
                                type="button"
                                class="action-assign-btn"
                                :disabled="assigningId === action.id"
                                title="Assign to me"
                                @click.stop="onAssignToMe(action)"
                            >
                              <Spinner v-if="assigningId === action.id" :size="16" />
                              <PersonAddIcon v-else />
                            </button>
                            <button
                                v-else-if="isAssignedToMe(action)"
                                type="button"
                                class="action-unassign-btn"
                                :disabled="unassigningId === action.id"
                                title="Unassign"
                                @click.stop="onUnassignMine(action)"
                            >
                              <Spinner v-if="unassigningId === action.id" :size="16" />
                              <PersonRemoveIcon v-else />
                            </button>
                            <ActionBtn
                                v-if="canDeleteAction(action)"
                                variant="danger"
                                :loading="trashingActionId === action.id"
                                @click.stop="onTrashAction(action)"
                            />
                          </span>
                        </template>
                      </Item>
                    </div>
                  </div>
                </VueDraggable>
              </div>
            </template>
          </div>
        </div>

        <!-- Description area -->
        <div class="detail-section-area">
          <label class="text-body-s fw-semibold detail-section-label">Description</label>
          <div class="detail-section-wrapper">
            <p
                v-if="editingField !== 'description'"
                class="text-body-m detail-section-content"
                :class="{ 'detail-section-content--empty': !project.description, 'detail-section-content--readonly': !isOwner }"
                @click="isOwner && startEdit('description', project.description || '')"
            >{{ project.description || (isOwner ? 'Add a description...' : '—') }}</p>
            <textarea
                v-else
                ref="descriptionInput"
                v-model="editValue"
                class="text-body-m detail-section-textarea"
                :disabled="savingField === 'description'"
                @keyup.esc="cancelEdit"
                @blur="saveField('description')"
                rows="1"
            ></textarea>
            <div v-if="editingField === 'description'" class="detail-section-actions">
              <Btn
                  variant="primary"
                  size="sm"
                  :disabled="savingField === 'description'"
                  :loading="savingField === 'description'"
                  @mousedown.prevent
                  @click="saveField('description')"
              >Save</Btn>
              <Btn
                  variant="secondary"
                  size="sm"
                  :disabled="savingField === 'description'"
                  @mousedown.prevent
                  @click="cancelEdit"
              >Cancel</Btn>
            </div>
          </div>
        </div>


        <!-- Tags section -->
        <div class="detail-section-area">
          <label class="text-body-s fw-semibold detail-section-label">Tags</label>
          <div class="detail-section-wrapper">
            <div v-if="editingField !== 'tags'" class="detail-tags-display" @click="startTagEdit()">
              <span v-if="project.tags && project.tags.length > 0" class="detail-tags-chips">
                <span v-for="tag in project.tags" :key="tag" class="text-body-s detail-tag-chip">{{ tag }}</span>
              </span>
              <span v-else class="text-body-m detail-section-content detail-section-content--empty">Add tags...</span>
            </div>
            <template v-else>
              <TagInput
                  v-model="editTags"
                  :disabled="savingField === 'tags'"
              />
              <div class="detail-section-actions">
                <Btn
                    variant="primary"
                    size="sm"
                    :disabled="savingField === 'tags'"
                    :loading="savingField === 'tags'"
                    @mousedown.prevent
                    @click="saveTags"
                >Save</Btn>
                <Btn
                    variant="secondary"
                    size="sm"
                    :disabled="savingField === 'tags'"
                    @mousedown.prevent
                    @click="cancelEdit"
                >Cancel</Btn>
              </div>
            </template>
          </div>
        </div>

        <!-- Shared with — user list (shared projects only) -->
        <div v-if="isShared" class="detail-section-area detail-shared-with">
          <div class="detail-shared-with__toolbar">
            <label class="text-body-s fw-semibold detail-section-label">Shared with</label>
            <span v-if="!currentMembersLoading && currentMembers.length > 0" class="text-footnote detail-shared-with__count">{{ currentMembers.length }}</span>
          </div>

          <div v-if="currentMembersLoading" class="detail-shared-with__loading">
            <Spinner :size="16" />
          </div>

          <template v-else>
            <div v-if="orderedSharedMembers.length > 0" class="user-list">
              <div
                  v-for="m in orderedSharedMembers"
                  :key="m.user_id"
                  class="user-item"
              >
                <UserAvatar :email="memberEmailFor(m.user_id) || m.email" class="user-item-icon" />
                <div class="user-item-info">
                  <span class="text-body-m user-item-name">{{ memberChipLabel(m) }}</span>
                  <Select
                      v-if="m.role !== 'owner' && isOwner"
                      :model-value="m.role"
                      :options="ROLE_OPTIONS"
                      title="Role"
                      class="user-item-role"
                      @update:model-value="(r) => onChangeRole(m, r)"
                  />
                  <span v-else class="text-body-s user-item-meta">{{ roleLabel(m.role) }}</span>
                </div>
                <div class="user-item-actions">
                  <ActionBtn
                      v-if="canRemoveMember(m)"
                      :loading="memberRemovingId === m.user_id"
                      @click="onRemoveMember(m)"
                  />
                </div>
              </div>
            </div>

            <!-- Add member trigger (owner only) — same style as "Attach another file..." -->
            <p
                v-if="isOwner && myTier === 'team' && addableConnections.length > 0"
                class="text-body-m detail-section-content detail-section-content--empty detail-shared-with__add"
                @click="openShareModal('add')"
            >Add another member...</p>

          </template>
        </div>

        <!-- Attachments section -->
        <AttachmentSection v-if="project.id" :entity-type="'project'" :item-id="project.id" :readonly="!canWrite" />

        <!-- Comments section -->
        <CommentSection v-if="project.id" :entity-type="'project'" :item-id="project.id" :members="currentMembers || []" />

        <!-- Completed tasks (all projects) -->
        <div class="detail-section-area">
          <button type="button" class="completed-toggle" @click="toggleCompleted">
            <span class="text-body-s fw-semibold detail-section-label">Completed</span>
            <span class="completed-toggle__chevron" :class="{ 'completed-toggle__chevron--open': completedExpanded }">▾</span>
          </button>
          <div v-if="completedExpanded" class="completed-list">
            <div v-if="completedLoading" class="next-action-loading"><Spinner :size="16" /></div>
            <p v-else-if="completedActions.length === 0" class="text-body-s detail-section-content detail-section-content--empty">
              No completed tasks yet.
            </p>
            <ul v-else class="completed-items">
              <li
                  v-for="act in completedActions"
                  :key="act.id"
                  class="completed-row"
                  @click="goToActionDetail(act)"
              >
                <span class="text-body-m completed-title">{{ act.title }}</span>
                <span class="text-footnote completed-meta">
                  <template v-if="isShared && completerLabel(act)">completed by {{ completerLabel(act) }} · </template>{{ formatCompletedDate(act.completed_at) }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Metadata section -->
        <div class="detail-metadata">
          <span class="detail-metadata-item">
            <span class="text-footnote detail-metadata-label">Created</span>
            <span class="text-footnote detail-metadata-value">{{ formatDate(project.created) }}</span>
          </span>
          <span class="text-footnote detail-metadata-separator">·</span>
          <span class="detail-metadata-item">
            <span class="text-footnote detail-metadata-label">Updated</span>
            <span class="text-footnote detail-metadata-value">{{ formatDate(project.updated) }}</span>
          </span>
        </div>

      </div>

    </div>

    <!-- Share / Add member modal -->
    <Modal
        :visible="shareModalOpen"
        :title="shareModalMode === 'share' ? 'Share project' : 'Add members'"
        max-width="480px"
        @close="closeShareModal"
    >
      <div class="share-modal__body">
        <input
            ref="shareModalSearchInput"
            v-model="shareModalFilter"
            type="text"
            class="text-body-m share-modal__filter"
            placeholder="Search a connection…"
            @keydown.esc="closeShareModal"
        />

        <p v-if="shareModalChoices.length === 0" class="text-body-s share-modal__empty">
          {{ shareableConnections.length === 0 ? 'You have no connections yet.' : 'No connections match your search.' }}
        </p>

        <ul v-else class="share-modal__list">
          <li
              v-for="c in shareModalChoices"
              :key="c.user_id"
              class="share-modal__item"
              :class="{ 'share-modal__item--selected': shareModalSelected.includes(c.user_id) }"
              @click="toggleShareSelected(c.user_id)"
          >
            <UserAvatar :email="c.email" class="user-item-icon" />
            <span class="text-body-m share-modal__name">{{ c.email }}</span>
            <span v-if="shareModalSelected.includes(c.user_id)" class="text-body-m share-modal__check">✓</span>
          </li>
        </ul>

        <p v-if="shareModalError" class="text-body-s share-modal__error">{{ shareModalError }}</p>
      </div>

      <template #actions>
        <Btn variant="secondary" size="md" :disabled="shareModalSubmitting" @click="closeShareModal">Cancel</Btn>
        <Btn
            variant="primary"
            size="md"
            :disabled="shareModalSelected.length === 0 || shareModalSubmitting"
            :loading="shareModalSubmitting"
            @click="submitShareModal"
        >{{ shareModalMode === 'share' ? 'Share' : 'Add' }}</Btn>
      </template>
    </Modal>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import Btn from '../../components/Btn.vue'
import Dropdown from '../../components/Dropdown.vue'
import ActionBtn from '../../components/ActionBtn.vue'
import TagInput from '../../components/TagInput.vue'
import CommentSection from '../../components/CommentSection.vue'
import AttachmentSection from '../../components/AttachmentSection.vue'
import Badge from '../../components/Badge.vue'
import UserAvatar from '../../components/UserAvatar.vue'
import Select from '../../components/Select.vue'
import Modal from '../../components/Modal.vue'
import { projectModel } from '../../scripts/models/projectModel.js'
import { connectionModel } from '../../scripts/models/connectionModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'
import { upgradeModel } from '../../scripts/core/upgradeModel.js'
import { authModel } from '../../scripts/core/authModel.js'
import apiClient from '../../scripts/core/apiClient.js'
import { statsModel } from '../../scripts/models/statsModel.js'
import { tagModel } from '../../scripts/models/tagModel.js'
import ProjectsIcon from '../../assets/ProjectsIcon.vue'
import NextIcon from '../../assets/NextIcon.vue'
import ReferenceIcon from '../../assets/ReferenceIcon.vue'
import SomedayIcon from '../../assets/SomedayIcon.vue'
import WarningIcon from '../../assets/WarningIcon.vue'
import TriangleLeftIcon from '../../assets/TriangleLeftIcon.vue'
import TriangleRightIcon from '../../assets/TriangleRightIcon.vue'
import ChevronsLeftIcon from '../../assets/ChevronsLeftIcon.vue'
import ChevronsRightIcon from '../../assets/ChevronsRightIcon.vue'
import PersonAddIcon from '../../assets/PersonAddIcon.vue'
import PersonRemoveIcon from '../../assets/PersonRemoveIcon.vue'
import Item from '../../components/Item.vue'
import Spinner from '../../components/Spinner.vue'
import EmptyState from '../../components/EmptyState.vue'
import { useAutoGrow } from '../../scripts/core/useAutoGrow.js'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()
const tagMdl = tagModel()
const auth = authModel()
const proj = projectModel()
const conn = connectionModel()

const {
  error,
  getProject,
  getProjectByPosition,
  updateProject,
  trashProject,
  completeProject,
  getProjectActions,
  loadMembers,
  shareProject,
  addMember,
  updateMemberRole,
  removeMember,
  assignAction,
  unassignAction,
  currentMembers,
  currentMembersLoading,
  currentRole,
} = proj

const project = ref(null)
const notFound = ref(false)
const pageLoading = ref(true)
const editingField = ref(null)
const editValue = ref('')
const savingField = ref(null)
const titleInput = ref(null)
const descriptionInput = ref(null)
const outcomeInput = ref(null)
useAutoGrow(descriptionInput)
useAutoGrow(outcomeInput)
const actionLoading = ref(null)
const showMoveDialog = ref(false)
const editTags = ref([])

// Actions state
const actionsLoading = ref(false)
const orderedActions = ref([])
const addInputVisible = ref(false)
const completingActionId = ref(null)
const trashingActionId = ref(null)
const newActionTitle = ref('')
const addingAction = ref(false)
const actionsScrollRef = ref(null)
const quickAddInput = ref(null)
const detailBodyRef = ref(null)

// Auto-hiding scrollbar
const bodyScrolling = ref(false)
const listScrolling = ref(false)
let bodyScrollTimer = null
let listScrollTimer = null

function onBodyScroll() {
  bodyScrolling.value = true
  clearTimeout(bodyScrollTimer)
  bodyScrollTimer = setTimeout(() => { bodyScrolling.value = false }, 1000)
}

function onListScroll() {
  listScrolling.value = true
  clearTimeout(listScrollTimer)
  listScrollTimer = setTimeout(() => { listScrolling.value = false }, 1000)
}

watch(detailBodyRef, (el, oldEl) => {
  if (oldEl) oldEl.removeEventListener('scroll', onBodyScroll)
  if (el) el.addEventListener('scroll', onBodyScroll, { passive: true })
})

watch(actionsScrollRef, (el, oldEl) => {
  if (oldEl) oldEl.removeEventListener('scroll', onListScroll)
  if (el) el.addEventListener('scroll', onListScroll, { passive: true })
})

onBeforeUnmount(() => {
  clearTimeout(bodyScrollTimer)
  clearTimeout(listScrollTimer)
  detailBodyRef.value?.removeEventListener('scroll', onBodyScroll)
  actionsScrollRef.value?.removeEventListener('scroll', onListScroll)
})

// Navigation state
const currentPosition = ref(0)
const totalItems = ref(1)
const navigating = ref(false)
const fromSource = ref(null)

// From-source route and label mappings
const FROM_ROUTES = {
  inbox: 'inbox', next: 'next', today: 'today', calendar: 'calendar',
  waiting: 'waiting-for', completed: 'completed', someday: 'someday',
  projects: 'projects', engage: 'engage', overdue: 'overdue',
  reference: 'reference', review: 'review',
}

const FROM_LABELS = {
  inbox: 'Inbox', next: 'Next', today: 'Today', calendar: 'Calendar',
  waiting: 'Waiting For', completed: 'Completed', someday: 'Someday / Maybe',
  projects: 'Projects', engage: 'Dashboard', overdue: 'Overdue',
  reference: 'Reference', review: 'Review', recurring: 'Recurring',
}

// Computed
const isCompleted = computed(() => project.value?.state === 'COMPLETED')
const isSomeday = computed(() => project.value?.state === 'SOMEDAY')

// Shared-project state
const ROLE_OPTIONS = [
  { value: 'write', label: 'Write' },
  { value: 'read_only', label: 'Read-only' },
]
const completedActions = ref([])
const completedExpanded = ref(false)
const completedLoading = ref(false)
const completedLoaded = ref(false)
const assigningId = ref(null)
const unassigningId = ref(null)

// Share / Add-member modal state
const shareModalOpen = ref(false)
const shareModalMode = ref('share')   // 'share' for personal→shared, 'add' for already-shared
const shareModalFilter = ref('')
const shareModalSelected = ref([])    // array of user_id
const shareModalSubmitting = ref(false)
const shareModalError = ref('')
const shareModalSearchInput = ref(null)
const memberRemovingId = ref(null)

const isShared = computed(() => !!project.value?.shared)
const myUserId = computed(() => auth.currentUser.value?.id || null)
const myTier = computed(() => auth.currentUser.value?.subscription_tier || 'free')

const isOwner = computed(() => {
  if (!project.value || !myUserId.value) return false
  if (!isShared.value) return true // personal projects are always "owned" by you
  if (project.value.owner_id) return project.value.owner_id === myUserId.value
  if (project.value.my_role) return project.value.my_role === 'owner'
  return currentRole.value === 'owner'
})

const myRole = computed(() => {
  if (!isShared.value) return 'owner'
  if (project.value?.my_role) return project.value.my_role
  return currentRole.value
})

const canWrite = computed(() => {
  if (!isShared.value) return true
  if (myTier.value !== 'team') return false
  return myRole.value === 'owner' || myRole.value === 'write'
})

const canManageMembers = computed(() => isShared.value && isOwner.value && myTier.value === 'team')

const myAssignedAction = computed(() => {
  if (!isShared.value || !myUserId.value) return null
  return orderedActions.value.find(a => a.assigned_to === myUserId.value) || null
})

function isAssignedToMe(action) {
  return !!(action?.assigned_to && action.assigned_to === myUserId.value)
}

// Unassigned actions and actions assigned to me can be completed/deleted by any project member.
// Actions assigned to someone else can only be acted on by that assignee.
function canCompleteAction(action) {
  if (!action) return false
  if (!action.assigned_to) return canWrite.value
  return isAssignedToMe(action)
}

function canDeleteAction(action) {
  if (!action) return false
  if (!action.assigned_to) return canWrite.value
  return isAssignedToMe(action)
}

function hasActionButtons(action) {
  if (!action) return false
  if (canDeleteAction(action)) return true
  if (canWrite.value && !action.assigned_to && !myAssignedAction.value) return true
  if (isAssignedToMe(action)) return true
  return false
}

function assigneeLabel(action) {
  if (!action?.assigned_to) return ''
  if (action.assigned_to === myUserId.value) return 'You'
  return action.assigned_to_email || memberEmailFor(action.assigned_to) || 'Unconnected member'
}

function memberEmailFor(userId) {
  if (!userId) return ''
  if (userId === myUserId.value) return auth.currentUser.value?.email || ''
  const m = (currentMembers.value || []).find(x => x.user_id === userId)
  if (m?.email) return m.email
  const c = (conn.connections.value || []).find(x => x.user_id === userId)
  if (c?.email) return c.email
  return ''
}

const orderedSharedMembers = computed(() => {
  const list = [...(currentMembers.value || [])]
  list.sort((a, b) => {
    if (a.role === 'owner') return -1
    if (b.role === 'owner') return 1
    if (a.user_id === myUserId.value) return -1
    if (b.user_id === myUserId.value) return 1
    return (a.added_at || '').localeCompare(b.added_at || '')
  })
  return list
})

function memberChipLabel(m) {
  if (m.user_id === myUserId.value) {
    return `${m.email || memberEmailFor(m.user_id) || auth.currentUser.value?.email || 'You'} (you)`
  }
  return m.email || memberEmailFor(m.user_id) || 'Unconnected member'
}

function roleLabel(role) {
  if (role === 'owner') return 'Owner'
  if (role === 'write') return 'Write'
  if (role === 'read_only') return 'Read-only'
  return role
}

const excludedAddUserIds = computed(() => {
  const set = new Set()
  if (myUserId.value) set.add(myUserId.value)
  for (const m of (currentMembers.value || [])) set.add(m.user_id)
  return set
})

// All accepted connections that can be picked for initial sharing
const shareableConnections = computed(() => conn.connections.value || [])

// Connections that aren't yet a member of this shared project
const addableConnections = computed(() => {
  const excluded = excludedAddUserIds.value
  return (conn.connections.value || []).filter(c => !excluded.has(c.user_id))
})

// Connections shown in the modal (filtered by mode + search query)
const shareModalChoices = computed(() => {
  const base = shareModalMode.value === 'share'
      ? shareableConnections.value
      : addableConnections.value
  const q = shareModalFilter.value.trim().toLowerCase()
  if (!q) return base
  return base.filter(c => (c.email || '').toLowerCase().includes(q))
})

function openSharedUpgrade() {
  upgradeModel().show({
    message: 'Working on shared projects — assigning actions, creating backlog items, and editing — is available on the Team plan.',
  })
}

function openShareModal(mode) {
  if (myTier.value !== 'team') {
    upgradeModel().show({
      message: 'Sharing projects with your connections is available on the Team plan.',
    })
    return
  }
  shareModalMode.value = mode
  shareModalFilter.value = ''
  shareModalSelected.value = []
  shareModalError.value = ''
  shareModalSubmitting.value = false
  shareModalOpen.value = true
  if (!conn.loaded.value) conn.loadAll().catch(() => {})
  nextTick(() => shareModalSearchInput.value?.focus())
}

function closeShareModal() {
  if (shareModalSubmitting.value) return
  shareModalOpen.value = false
}

function toggleShareSelected(userId) {
  const idx = shareModalSelected.value.indexOf(userId)
  if (idx === -1) shareModalSelected.value.push(userId)
  else shareModalSelected.value.splice(idx, 1)
}

async function submitShareModal() {
  if (shareModalSelected.value.length === 0) return
  shareModalError.value = ''
  shareModalSubmitting.value = true
  try {
    if (shareModalMode.value === 'share') {
      const members = shareModalSelected.value.map(uid => ({ user_id: uid, role: 'write' }))
      await shareProject(project.value.id, members)
      project.value = { ...project.value, shared: true, owner_id: myUserId.value, my_role: 'owner' }
      await loadProjectActions()
      toaster.success('Project shared')
    } else {
      for (const uid of shareModalSelected.value) {
        await addMember(project.value.id, uid, 'write')
      }
    }
    shareModalOpen.value = false
  } catch (err) {
    const status = err?.status || err?.response?.status
    if (status === 403) shareModalError.value = 'Sharing requires the Team plan.'
    else if (status === 409) shareModalError.value = 'Project state changed — please retry.'
    else if (status === 400) shareModalError.value = 'Invalid selection — please retry.'
    else shareModalError.value = friendlyMemberError(err, 'Could not complete the action.')
  } finally {
    shareModalSubmitting.value = false
  }
}

function canRemoveMember(m) {
  if (m.role === 'owner') return false
  if (isOwner.value) return true
  return false
}

function friendlyMemberError(err, fallback) {
  const status = err?.status || err?.response?.status
  if (status === 403) return 'You do not have permission for this action.'
  if (status === 400) return 'Invalid request.'
  if (status === 404) return 'Member not found.'
  if (status === 409) return 'This person is already on the project.'
  return fallback
}

async function onChangeRole(m, role) {
  if (m.role === role) return
  try {
    await updateMemberRole(project.value.id, m.user_id, role)
  } catch (err) {
    toaster.push(friendlyMemberError(err, 'Could not update role.'))
  }
}

async function onRemoveMember(m) {
  const confirmed = await confirm.show({
    title: 'Remove member?',
    message: `${m.email || memberEmailFor(m.user_id) || 'This member'} will lose access. Their assigned actions return to the backlog.`,
    confirmText: 'Remove',
    cancelText: 'Cancel',
  })
  if (!confirmed) return
  memberRemovingId.value = m.user_id
  try {
    const data = await removeMember(project.value.id, m.user_id)
    if (data?.auto_unshared) onAutoUnshared()
  } catch (err) {
    toaster.push(friendlyMemberError(err, 'Could not remove member.'))
  } finally {
    memberRemovingId.value = null
  }
}

async function onLeaveProject() {
  const confirmed = await confirm.show({
    title: 'Leave this project?',
    message: 'You will lose access. Any actions assigned to you return to the backlog.',
    confirmText: 'Leave',
    cancelText: 'Cancel',
  })
  if (!confirmed) return
  actionLoading.value = 'leave'
  try {
    await removeMember(project.value.id, myUserId.value)
    router.push({ name: 'projects' })
  } catch (err) {
    toaster.push(friendlyMemberError(err, 'Could not leave project.'))
  } finally {
    actionLoading.value = null
  }
}

const fromCompleted = computed(() => fromSource.value === 'completed')
const fromSomeday = computed(() => fromSource.value === 'someday')
const fromMixedList = computed(() => fromCompleted.value || fromSomeday.value)
const backLabel = computed(() => {
  if (fromSource.value && FROM_LABELS[fromSource.value]) return FROM_LABELS[fromSource.value]
  if (isCompleted.value) return 'Completed'
  if (isSomeday.value) return 'Someday / Maybe'
  return 'Projects'
})

watch(error, (err) => {
  if (!err) return
  if (err?.status === 404) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(async () => {
  try {
    fromSource.value = route.query.from || null

    const data = await getProject(route.params.id)
    project.value = { ...data }

    currentPosition.value = Number(route.query.position) || 0
    totalItems.value = Number(route.query.total) || 1

    // Load project actions
    await loadProjectActions()

  } catch (err) {
    if (err?.status === 404) {
      notFound.value = true
    } else {
      toaster.push('Failed to load project')
      router.push({ name: 'projects' })
    }
  } finally {
    pageLoading.value = false
  }
})

function goBack() {
  const mapped = fromSource.value && FROM_ROUTES[fromSource.value]
  if (mapped) {
    router.push({ name: mapped })
  } else if (isCompleted.value) {
    router.push({ name: 'completed' })
  } else if (isSomeday.value) {
    router.push({ name: 'someday' })
  } else {
    router.push({ name: 'projects' })
  }
}

function goToProjects() {
  router.push({ name: 'projects' })
}

function startEdit(field, value) {
  if (savingField.value) return
  editingField.value = field
  editValue.value = value
  nextTick(() => {
    if (field === 'title' && titleInput.value) {
      autoResizeTitle()
      titleInput.value.focus()
      titleInput.value.select()
    } else if (field === 'description' && descriptionInput.value) {
      descriptionInput.value.focus()
    } else if (field === 'outcome' && outcomeInput.value) {
      outcomeInput.value.focus()
    }
  })
}

function cancelEdit() {
  editingField.value = null
  editValue.value = ''
}

function autoResizeTitle() {
  if (titleInput.value) {
    titleInput.value.style.height = '0'
    titleInput.value.style.height = Math.max(44, titleInput.value.scrollHeight) + 'px'
  }
}

async function saveField(field) {
  if (editingField.value !== field) return
  if (savingField.value) return
  const newValue = editValue.value.trim()

  if (field === 'title' && (!newValue || newValue === project.value.title)) {
    editingField.value = null
    return
  }

  if (field === 'description' && newValue === (project.value.description || '')) {
    editingField.value = null
    return
  }

  if (field === 'outcome' && newValue === (project.value.outcome || '')) {
    editingField.value = null
    return
  }

  const oldValue = project.value[field]
  project.value[field] = newValue
  savingField.value = field

  try {
    await updateProject(project.value.id, {
      title: project.value.title,
      description: project.value.description,
      outcome: project.value.outcome
    })
    editingField.value = null
  } catch {
    project.value[field] = oldValue
    toaster.push('Failed to save changes')
    setTimeout(() => {
      if (field === 'title') {
        titleInput.value?.focus()
      } else if (field === 'description') {
        descriptionInput.value?.focus()
      } else if (field === 'outcome') {
        outcomeInput.value?.focus()
      }
    }, 100)
  } finally {
    savingField.value = null
  }
}

function startTagEdit() {
  if (savingField.value) return
  editingField.value = 'tags'
  editTags.value = [...(project.value.tags || [])]
}

async function saveTags() {
  if (editingField.value !== 'tags' || savingField.value) return

  const newTags = [...editTags.value]
  const oldTags = project.value.tags || []

  if (JSON.stringify(newTags) === JSON.stringify(oldTags)) {
    editingField.value = null
    return
  }

  project.value.tags = newTags
  savingField.value = 'tags'

  const body = isOwner.value
    ? {
        title: project.value.title,
        description: project.value.description,
        outcome: project.value.outcome,
        tags: newTags,
      }
    : { tags: newTags }

  try {
    await updateProject(project.value.id, body)
    tagMdl.addToCache(newTags)
    editingField.value = null
  } catch {
    project.value.tags = oldTags
    toaster.push('Failed to save tags')
  } finally {
    savingField.value = null
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString()
}

// Navigation functions
async function navigateToPosition(position) {
  if (navigating.value) return
  if (position < 0 || position >= totalItems.value) return

  navigating.value = true
  try {
    let getByPosition
    if (fromCompleted.value) {
      getByPosition = apiClient.getCompletedByPosition
    } else if (fromSomeday.value) {
      getByPosition = apiClient.getSomedayByPosition
    } else {
      getByPosition = getProjectByPosition
    }
    const data = await getByPosition(position)

    // Mixed-type lists - redirect if type changed
    if (fromMixedList.value && data.type !== 'PROJECT') {
      const query = { position: data.position, total: data.total_items || totalItems.value, from: fromSource.value }
      const name = data.type === 'STUFF' ? 'stuff-detail' : 'action-detail'
      router.replace({ name, params: { id: data.id }, query })
      return
    }

    project.value = { ...data }
    currentPosition.value = data.position
    if (typeof data.total_items === 'number') {
      totalItems.value = data.total_items
    }
    router.replace({
      name: 'project-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value, from: fromSource.value || undefined }
    })
    // Reload actions for new project
    await loadProjectActions()
  } catch {
    toaster.push('Failed to load project')
  } finally {
    navigating.value = false
  }
}

function goFirst() {
  navigateToPosition(0)
}

function goPrev() {
  navigateToPosition(currentPosition.value - 1)
}

function goNext() {
  navigateToPosition(currentPosition.value + 1)
}

function goLast() {
  navigateToPosition(totalItems.value - 1)
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '…'
}

async function onComplete() {
  const hasActions = orderedActions.value.length > 0
  if (hasActions) {
    const confirmed = await confirm.show({
      title: 'Complete Project',
      message: `This will complete active action and all actions in backlog. Are you sure?`,
      confirmText: 'Complete',
      cancelText: 'Cancel'
    })
    if (!confirmed) return
  }

  actionLoading.value = 'complete'
  const title = truncateTitle(project.value.title)
  try {
    await completeProject(project.value.id)
    toaster.success(`"${title}" completed`)
    await navigateToNextOrPrev()
  } catch (err) {
    toaster.push(err.message || 'Failed to complete project')
  } finally {
    actionLoading.value = null
  }
}

async function navigateToNextOrPrev() {
  const newTotal = totalItems.value - 1
  let backRoute = (fromSource.value && FROM_ROUTES[fromSource.value]) || 'projects'
  if (backRoute === 'projects') {
    // State-based fallback
    if (isCompleted.value) backRoute = 'completed'
    else if (isSomeday.value) backRoute = 'someday'
  }

  if (newTotal <= 0) {
    router.push({ name: backRoute })
    return
  }

  const nextPos = currentPosition.value >= newTotal ? newTotal - 1 : currentPosition.value

  try {
    let getByPosition
    if (fromCompleted.value) {
      getByPosition = apiClient.getCompletedByPosition
    } else if (fromSomeday.value) {
      getByPosition = apiClient.getSomedayByPosition
    } else {
      getByPosition = getProjectByPosition
    }
    const data = await getByPosition(nextPos)

    // Mixed-type lists - redirect if type changed
    if (fromMixedList.value && data.type !== 'PROJECT') {
      const query = { position: data.position, total: data.total_items ?? newTotal, from: fromSource.value }
      const name = data.type === 'STUFF' ? 'stuff-detail' : 'action-detail'
      router.replace({ name, params: { id: data.id }, query })
      return
    }

    project.value = { ...data }
    currentPosition.value = data.position
    totalItems.value = data.total_items ?? newTotal
    router.replace({
      name: 'project-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value, from: fromSource.value || undefined }
    })
    // Reload actions for new project
    await loadProjectActions()
  } catch {
    router.push({ name: backRoute })
  }
}

async function onTrash() {
  const hasActions = orderedActions.value.length > 0
  const message = hasActions
    ? `This will also move all actions in this project to trash. Are you sure?`
    : `Are you sure you want to move "${project.value.title}" to trash?`

  const confirmed = await confirm.show({
    title: 'Move to Trash',
    message,
    confirmText: 'Move to Trash',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  actionLoading.value = 'trash'
  try {
    await trashProject(project.value.id)
    toaster.success(`"${truncateTitle(project.value.title)}" moved to trash`)
    if (isSomeday.value) {
      router.push({ name: 'someday' })
    } else {
      await navigateToNextOrPrev()
    }
  } catch (err) {
    toaster.push(err.message || 'Failed to move project to trash')
  } finally {
    actionLoading.value = null
  }
}

async function onUndo() {
  actionLoading.value = 'undo'
  const title = truncateTitle(project.value.title)
  try {
    await apiClient.uncompleteProject(project.value.id)
    statsModel().refreshStats()
    toaster.success(`"${title}" restored to projects`)
    router.push({ name: 'completed' })
  } catch (err) {
    toaster.push(err.message || 'Failed to restore project')
  } finally {
    actionLoading.value = null
  }
}

async function onActivate() {
  actionLoading.value = 'activate'
  const title = truncateTitle(project.value.title)
  try {
    await apiClient.activateProject(project.value.id)
    statsModel().refreshStats()
    toaster.success(`"${title}" moved to Projects`)
    router.push({ name: 'someday' })
  } catch (err) {
    toaster.push(err.message || 'Failed to activate project')
  } finally {
    actionLoading.value = null
  }
}

async function onMoveTo(target) {
  showMoveDialog.value = false

  if (target === 'ACTION') {
    if (orderedActions.value.length > 1) {
      const confirmed = await confirm.show({
        title: 'Convert to Action',
        message: `This will trash all backlog actions in this project. Continue?`,
        confirmText: 'Convert',
        cancelText: 'Cancel'
      })
      if (!confirmed) return
    }

    actionLoading.value = 'move'
    try {
      await apiClient.transformProjectToAction(project.value.id)
      statsModel().refreshStats()
      toaster.success(`"${truncateTitle(project.value.title)}" converted to action`)
      await navigateToNextOrPrev()
    } catch (err) {
      toaster.push(err.message || 'Failed to convert to action')
    } finally {
      actionLoading.value = null
    }
    return
  }

  if (target === 'REFERENCE') {
    if (orderedActions.value.length > 0) {
      const confirmed = await confirm.show({
        title: 'Convert to Reference',
        message: `This will convert the project and all its actions to a reference file. Continue?`,
        confirmText: 'Convert',
        cancelText: 'Cancel'
      })
      if (!confirmed) return
    }

    actionLoading.value = 'move'
    try {
      await apiClient.transformProjectToFile(project.value.id)
      statsModel().refreshStats()
      toaster.success(`"${truncateTitle(project.value.title)}" moved to Reference`)
      await navigateToNextOrPrev()
    } catch (err) {
      toaster.push(err.message || 'Failed to move to Reference')
    } finally {
      actionLoading.value = null
    }
    return
  }

  if (target === 'SOMEDAY') {
    actionLoading.value = 'move'
    const oldState = project.value.state
    project.value.state = 'SOMEDAY'
    const hasActions = orderedActions.value.length > 0

    try {
      await apiClient.somedayProject(project.value.id)
      statsModel().refreshStats()
      const msg = hasActions
        ? `"${truncateTitle(project.value.title)}" moved to Someday. Active actions shelved.`
        : `"${truncateTitle(project.value.title)}" moved to Someday`
      toaster.success(msg)
      await navigateToNextOrPrev()
    } catch (err) {
      project.value.state = oldState
      toaster.push(err.message || 'Failed to move project')
    } finally {
      actionLoading.value = null
    }
  }
}

const ACTION_STATE_LABELS = {
  NEXT: 'Next Action',
  TODAY: 'Today',
  WAITING: 'Waiting For',
  CALENDAR: 'Calendar',
}

const ACTION_STATE_ROUTES = {
  NEXT: 'next',
  TODAY: 'today',
  WAITING: 'waiting-for',
  CALENDAR: 'calendar',
}

function actionStateLabel(state) {
  return ACTION_STATE_LABELS[state] || state
}

function goToActionList(state) {
  const name = ACTION_STATE_ROUTES[state]
  if (name) router.push({ name })
}

// ── Project Actions functions ──

async function loadProjectActions() {
  if (!project.value?.id) return

  // Probe membership first — discovers shared status while BE response is missing
  // `shared`/`owner_id` fields. If members come back, we mark the project as shared
  // so the shared layout (badge, members list, backlog, My Action) renders.
  try {
    const members = await loadMembers(project.value.id)
    if (members && members.length > 0) {
      const ownerMember = members.find(m => m.role === 'owner')
      const meMember = members.find(m => m.user_id === myUserId.value)
      project.value = {
        ...project.value,
        shared: true,
        owner_id: project.value.owner_id || ownerMember?.user_id || null,
        my_role: project.value.my_role || meMember?.role || null,
      }
    } else {
      project.value = { ...project.value, shared: false }
    }
  } catch {
    // 403/404 → not a shared project (or no membership). Leave personal.
    project.value = { ...project.value, shared: false }
  }

  actionsLoading.value = true
  try {
    const data = await getProjectActions(project.value.id)
    const actions = Array.isArray(data) ? data : (data.items || [])
    orderedActions.value = actions.sort((a, b) => a.backlog_position - b.backlog_position)
  } catch {
    toaster.push('Failed to load project actions')
  } finally {
    actionsLoading.value = false
  }

  // Reset completed cache so a re-loaded project re-fetches when expanded
  completedActions.value = []
  completedLoaded.value = false
  completedExpanded.value = false
}

// ── Sharing ──

function onAutoUnshared() {
  project.value = { ...project.value, shared: false }
  loadProjectActions()
}

// ── Self-assign / Unassign ──

async function onAssignToMe(action) {
  if (!action || !canWrite.value) return
  if (myAssignedAction.value) {
    toaster.push('You can only have one assigned action per shared project. Unassign or complete the current one first.')
    return
  }
  assigningId.value = action.id
  try {
    await assignAction(action.id)
    await loadProjectActions()
  } catch (err) {
    const status = err?.status || err?.response?.status
    if (status === 409) {
      toaster.push('This action was just claimed by another member.')
    } else if (status === 403) {
      toaster.push('You do not have permission to claim actions on this project.')
    } else {
      toaster.push('Failed to claim action.')
    }
    await loadProjectActions()
  } finally {
    assigningId.value = null
  }
}

async function onUnassignMine(action) {
  if (!action) return
  unassigningId.value = action.id
  try {
    await unassignAction(action.id)
    await loadProjectActions()
  } catch (err) {
    toaster.push('Failed to unassign action.')
  } finally {
    unassigningId.value = null
  }
}

// ── Completed ──

async function toggleCompleted() {
  completedExpanded.value = !completedExpanded.value
  if (completedExpanded.value && !completedLoaded.value) {
    completedLoading.value = true
    try {
      const res = await apiClient.listProjectCompleted(project.value.id, { limit: 100 })
      completedActions.value = res?.items || []
      completedLoaded.value = true
    } catch {
      toaster.push('Failed to load completed tasks')
    } finally {
      completedLoading.value = false
    }
  }
}

function formatCompletedDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function completerLabel(act) {
  if (!isShared.value) return ''
  if (!act.completed_by) return ''
  if (act.completed_by === myUserId.value) return 'you'
  return act.completed_by_email || memberEmailFor(act.completed_by) || 'a member'
}

async function onActionUpdate(actionId, data) {
  try {
    await apiClient.updateAction(actionId, data)
    const idx = orderedActions.value.findIndex(a => a.id === actionId)
    if (idx >= 0) orderedActions.value[idx].title = data.title
  } catch {
    toaster.push('Failed to update action')
    await loadProjectActions()
  }
}

async function onCompleteAction(action) {
  if (!action) return

  completingActionId.value = action.id
  const title = truncateTitle(action.title)

  try {
    await apiClient.completeAction(action.id)
    statsModel().refreshStats()
    toaster.success(`"${title}" completed`)
    await loadProjectActions()
  } catch {
    toaster.push('Failed to complete action')
  } finally {
    completingActionId.value = null
  }
}

function goToActionDetail(act) {
  router.push({
    name: 'action-detail',
    params: { id: act.id },
    query: { from: 'project', project_id: project.value.id, project_title: project.value.title }
  })
}

async function onTrashAction(action) {
  const confirmed = await confirm.show({
    title: 'Move to Trash',
    message: `Are you sure you want to move "${action.title}" to trash?`,
    confirmText: 'Move to Trash',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  trashingActionId.value = action.id
  try {
    await apiClient.trashAction(action.id)
    statsModel().refreshStats()
    toaster.success(`"${truncateTitle(action.title)}" moved to trash`)
    if (action.id === orderedActions.value[0]?.id) {
      await loadProjectActions()
    } else {
      orderedActions.value = orderedActions.value.filter(a => a.id !== action.id)
    }
  } catch {
    toaster.push('Failed to move action to trash')
  } finally {
    trashingActionId.value = null
  }
}

async function onBacklogReorder(evt) {
  if (evt.oldIndex === evt.newIndex) return

  const movedAction = orderedActions.value[evt.newIndex]
  if (!movedAction) return

  try {
    await apiClient.moveProjectAction(movedAction.id, evt.newIndex)
    if (evt.oldIndex === 0 || evt.newIndex === 0) {
      await loadProjectActions()
    }
  } catch {
    toaster.push('Failed to reorder actions')
    await loadProjectActions()
  }
}

function focusAddInput() {
  addInputVisible.value = true
  nextTick(() => {
    quickAddInput.value?.focus()
  })
}

function onAddInputBlur() {
  if (orderedActions.value.length === 0 && !newActionTitle.value.trim()) {
    addInputVisible.value = false
  }
}

async function onAddAction() {
  const title = newActionTitle.value.trim()
  if (!title || !project.value?.id) return

  addingAction.value = true
  try {
    await apiClient.addAction({
      title,
      project_id: project.value.id,
      state: 'NEXT',
    })
    await loadProjectActions()
    newActionTitle.value = ''
    statsModel().refreshStats()
    toaster.success(`"${truncateTitle(title)}" added`)
    nextTick(() => {
      if (actionsScrollRef.value) {
        actionsScrollRef.value.scrollTop = actionsScrollRef.value.scrollHeight
      }
      quickAddInput.value?.focus()
    })
  } catch {
    toaster.push('Failed to add action')
  } finally {
    addingAction.value = false
  }
}
</script>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-back-link {
  color: var(--color-link-text);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.detail-back-link:hover {
  background: var(--color-bg-secondary);
  color: var(--color-link-hover);
}

.detail-meta-link {
  color: var(--color-link-text);
  cursor: pointer;
}

.detail-meta-link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

.detail-position {
  position: relative;
  color: var(--color-text-primary);
  min-width: 60px;
  text-align: center;
  padding: 0 4px;
}

.detail-nav-buttons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.detail-nav-btn {
  font-size: var(--font-size-xs);
}

.detail-nav-icon {
  width: 18px;
  height: 18px;
}

.detail-nav-spinner {
  position: absolute;
  inset: 0;
  margin: auto;
}

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.detail-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1;
  padding: 64px 24px;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  touch-action: pan-y;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.detail-body.scrolling {
  scrollbar-color: var(--color-border-light) transparent;
}

.detail-body::-webkit-scrollbar {
  width: 4px;
}

.detail-body::-webkit-scrollbar-track {
  background: transparent;
}

.detail-body::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
}

.detail-body.scrolling::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
}

.detail-section-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay-white);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 4px;
}

/* ── Title area ── */
.detail-title-area {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 24px 24px 0 32px;
  position: relative;
}

.detail-type-icon {
  position: absolute;
  left: 2px;
  width: 22px;
  height: 22px;
  color: var(--color-text-tertiary);
}

.detail-title-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.detail-title {
  color: var(--color-text-primary);
  margin: 0;
  padding: 5px 0;
  border: 1px solid transparent;
  border-radius: 6px;
  line-height: var(--lh-normal);
  word-break: break-word;
  cursor: pointer;
}

.detail-title:hover {
  background: var(--color-bg-secondary);
}

.detail-title--readonly {
  cursor: default;
}

.detail-title--readonly:hover {
  background: transparent;
}

.detail-title--hidden {
  visibility: hidden;
}

.detail-title--completed {
  text-decoration: line-through;
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.detail-title-input {
  position: absolute;
  top: 0;
  left: -8px;
  right: -8px;
  color: var(--color-text-primary);
  margin: 0;
  padding: 5px 8px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  line-height: var(--lh-normal);
  box-sizing: border-box;
  outline: none;
  background: var(--color-bg-primary);
  resize: none;
  overflow: hidden;
}

.detail-title-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

/* ── Action buttons ── */
.detail-actions {
  display: flex;
  gap: 8px;
  padding: 16px 24px 16px 32px;
}

/* ── Section areas (outcome, description) ── */
.detail-section-area {
  padding: 12px 24px 12px 32px;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-section-area--no-border {
  border-bottom: none;
}

.detail-section-label {
  display: block;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.detail-section-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-section-content {
  color: var(--color-text-primary);
  margin: 0;
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
  border: 1px solid transparent;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: var(--lh-relaxed);
  min-height: 32px;
  box-sizing: border-box;
}

.detail-section-content:hover {
  background: var(--color-bg-secondary);
}

.detail-section-content--readonly {
  cursor: default;
}

.detail-section-content--readonly:hover {
  background: transparent;
}

.detail-section-content--empty {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.detail-section-textarea {
  color: var(--color-text-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 4px;
  padding: 4px 8px;
  margin-left: -8px;
  margin-right: -8px;
  outline: none;
  resize: none;
  background: var(--color-bg-primary);
  box-sizing: border-box;
  line-height: var(--lh-relaxed);
  min-height: 32px;
  field-sizing: content;
}

.detail-section-textarea:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.detail-section-actions {
  display: flex;
  gap: 8px;
}

/* ── Tags section ── */
.detail-tags-display {
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.detail-tags-display:hover {
  background: var(--color-bg-secondary);
}

.detail-tags-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  background: var(--color-bg-accent-light);
  border: none;
  border-radius: 9999px;
  color: var(--color-action);
  white-space: nowrap;
  line-height: 1.3;
}

/* ── Metadata section ── */
.detail-metadata {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 16px 24px 24px 32px;
  margin-top: 8px;
}

.detail-metadata-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.detail-metadata-label {
  color: var(--color-text-tertiary);
}

.detail-metadata-value {
  color: var(--color-text-secondary);
}

.detail-metadata-separator {
  color: var(--color-text-tertiary);
}

.detail-section-textarea:disabled,
.detail-title-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


/* ── Next Action section ── */
.next-action-wrapper {
  margin-top: 4px;
}

.next-action-loading {
  padding: 12px 0;
}

.next-action-prompt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-warning-light);
  border-left: 3px solid var(--color-warning);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.next-action-prompt:hover {
  background: var(--color-warning-light);
}

.shared-readonly-notice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: var(--color-action-subtle);
  border-left: 3px solid var(--color-action);
  border-radius: 4px;
}

.shared-readonly-text {
  margin: 0;
  color: var(--color-text-secondary);
}

.next-action-prompt__icon {
  width: 24px;
  height: 24px;
  padding: 4px;
  box-sizing: border-box;
  flex-shrink: 0;
  color: var(--color-warning);
}

.next-action-prompt__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.next-action-prompt__text strong {
  color: var(--color-text-primary);
}

.next-action-prompt__text span {
  color: var(--color-text-secondary);
}

/* ── Action list ── */
.actions-list-scroll {
  max-height: 630px;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--color-bg-primary);
  border-radius: 4px;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.actions-list-scroll.scrolling {
  scrollbar-color: var(--color-border-light) transparent;
}

.actions-list-scroll::-webkit-scrollbar {
  width: 4px;
}

.actions-list-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.actions-list-scroll::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
}

.actions-list-scroll.scrolling::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
}

.action-wrapper {
  cursor: grab;
  user-select: none;
  -webkit-touch-callout: none;
}

.action-wrapper:active {
  cursor: grabbing;
}

.action-wrapper--chosen .item {
  background: var(--color-bg-hover);
}

.action-wrapper--ghost .item {
  background: var(--color-btn-secondary-hover);
}

.action-wrapper--ghost .item > * {
  opacity: 0;
}

.action-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-primary);
  transition: background 0.15s ease;
}

@media (hover: hover) and (pointer: fine) {
  .action-row:hover {
    background: var(--color-bg-hover);
  }
}

.action-row :deep(.item) {
  flex: 1;
  min-width: 0;
  border-bottom: none;
}

.action-row :deep(.item:hover) {
  background: transparent;
}

.action-state-link {
  color: var(--color-text-tertiary);
  cursor: pointer;
  white-space: nowrap;
  padding-right: 16px;
  flex-shrink: 0;
}

.action-state-link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

/* ── Actions quick-add ── */
.actions-quick-add--top {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin-bottom: 8px;
}

.actions-quick-add-input {
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 10px 12px;
  outline: none;
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
}

.actions-quick-add-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.actions-quick-add-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.actions-quick-add-input::placeholder {
  color: var(--color-text-tertiary);
}

.actions-quick-add-btn {
  flex-shrink: 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .detail-header {
    padding: 8px 12px;
  }

  .detail-header-left {
    gap: 6px;
  }

  .detail-header-right {
    gap: 8px;
  }

  .detail-title-area {
    padding: 16px 16px 0 32px;
  }

  .detail-actions {
    padding: 12px 16px 12px 32px;
  }

  .detail-section-area {
    padding: 12px 16px 12px 32px;
  }

  .detail-metadata {
    padding: 12px 16px 16px 32px;
  }
}

/* ── Shared project additions ── */

.detail-shared-badge {
  margin-left: 8px;
  align-self: center;
}

.detail-shared-with__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-shared-with__toolbar .detail-section-label {
  margin-bottom: 0;
}

.detail-shared-with__count {
  color: var(--color-text-tertiary);
}

.detail-shared-with__loading {
  padding: 12px 0;
}

/* ── User list (mirrors AttachmentSection .attachment-list) ── */
.user-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 4px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--color-border-light);
  border-radius: 4px;
  cursor: pointer;
}

.user-item:last-child {
  border-bottom: none;
}

.user-item:hover {
  background: var(--color-bg-secondary);
}

.user-item-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.user-item-icon :deep(.avatar-wrapper) {
  width: 24px;
  height: 24px;
}

.user-item-icon :deep(.avatar-fallback) {
  font-size: 10px;
}

.user-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.user-item-name {
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-item-meta {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

/* Select restyled as inline baseline meta — matches attachment-item-size pattern */
.user-item-role {
  flex-shrink: 0;
  display: inline-flex;
  align-self: baseline;
}

.user-item-role :deep(.select-trigger) {
  background: transparent;
  border: none;
  padding: 0 2px;
  min-width: 0;
  color: var(--color-text-tertiary);
  border-radius: 4px;
  font-size: var(--font-size-body-s);
  gap: 4px;
}

.user-item-role :deep(.select-trigger:hover) {
  background: var(--color-bg-hover, var(--color-bg-secondary));
  color: var(--color-text-primary);
}

.user-item-role :deep(.select-trigger--open) {
  border: none;
  background: var(--color-bg-hover, var(--color-bg-secondary));
  color: var(--color-text-primary);
}

.user-item-role :deep(.select-arrow) {
  font-size: 9px;
}

.user-item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.user-item:hover .user-item-actions {
  opacity: 1;
}

@media (hover: none) and (pointer: coarse) {
  .user-item-actions {
    opacity: 1;
  }
}

.detail-shared-with__add {
  margin-top: 4px;
}

.detail-shared-with__error {
  margin: 6px 0 0;
  color: var(--color-danger);
}

/* ── Share / Add-member modal ── */
.share-modal__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-modal__filter {
  padding: 8px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  box-sizing: border-box;
  outline: none;
}

.share-modal__filter:focus {
  border-color: var(--color-action);
}

.share-modal__filter::placeholder {
  color: var(--color-text-tertiary);
}

.share-modal__empty {
  margin: 0;
  padding: 8px 4px;
  color: var(--color-text-tertiary);
}

.share-modal__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  max-height: 280px;
  overflow-y: auto;
}

.share-modal__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  cursor: pointer;
  border-radius: 4px;
}

.share-modal__item:hover {
  background: var(--color-bg-secondary);
}

.share-modal__item--selected {
  background: var(--color-bg-accent-light);
}

.share-modal__name {
  flex: 1;
  min-width: 0;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share-modal__check {
  color: var(--color-action);
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}

.share-modal__error {
  margin: 0;
  color: var(--color-danger);
}

.completed-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  padding: 0;
  width: 100%;
  cursor: pointer;
  text-align: left;
  margin-bottom: 8px;
}

.completed-toggle__chevron {
  color: var(--color-text-tertiary);
  font-size: 12px;
  transition: transform 0.15s;
}

.completed-toggle__chevron--open {
  transform: rotate(180deg);
}

.completed-list {
  margin-top: 4px;
}

.completed-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.completed-row {
  display: flex;
  flex-direction: column;
  padding: 8px 4px;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
}

.completed-row:hover {
  background: var(--color-bg-secondary);
}

.completed-title {
  color: var(--color-text-primary);
}

.completed-meta {
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

/* Assignee email on the right edge of the cell — for actions assigned to someone else.
   Pushed right via margin-left:auto so it aligns with where the X button sits on other rows. */
.action-assignee-right {
  color: var(--color-text-tertiary);
  white-space: nowrap;
  margin-left: auto;
}

/* Assign / Unassign icon buttons — same scale as ActionBtn (16px icon, 4px 8px padding) */
.action-assign-btn,
.action-unassign-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-action);
}

.action-assign-btn:hover,
.action-unassign-btn:hover {
  background: var(--color-action-bg-light, var(--color-bg-secondary));
}

.action-assign-btn svg,
.action-unassign-btn svg {
  width: 22px;
  height: 22px;
}

.action-assign-btn:disabled,
.action-unassign-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* "You" chip on the right edge — for actions assigned to me. Hidden on hover (replaced by buttons) and on touch devices. */
.action-assignee-self {
  color: var(--color-text-tertiary);
  white-space: nowrap;
  margin-left: auto;
}

.shared-action-wrapper:hover .action-assignee-self {
  display: none;
}

@media (hover: none) and (pointer: coarse) {
  .action-assignee-self {
    display: none;
  }
}

/* Keep the assignee inline always visible; only Assign/Unassign buttons hide on non-hover.
   Reserve a fixed height matching the buttons so the row doesn't jump on hover. */
.shared-action-wrapper :deep(.item__actions) {
  opacity: 1;
  align-items: center;
  min-height: 30px;
}

/* Let title area extend all the way to the email chip — collapse the flex separator */
.shared-action-wrapper :deep(.item__separator) {
  flex: 0;
}

.shared-action-wrapper .action-row-buttons {
  display: none;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.shared-action-wrapper:hover .action-row-buttons {
  display: inline-flex;
}

@media (hover: none) and (pointer: coarse) {
  .shared-action-wrapper .action-row-buttons {
    display: inline-flex;
  }
}
</style>
