<template>
    <div class="settings-page" :class="{ 'settings-page--compact': isCompact }">

      <!-- Header: desktop and the ≤ 1024px index show the title + search, a section screen its back link -->
      <div v-if="showIndex" class="settings-header">
        <h1 class="page-title">Settings</h1>
        <div class="settings-header-right">
          <div v-if="searchVisible" class="settings-search-wrap">
            <Inpt
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Search settings..."
                @enter="onSearchEnter"
            />
          </div>
          <button type="button" class="settings-search-btn" :class="{ 'settings-search-btn--active': searchVisible }" @click="toggleSearch" aria-label="Search settings">
            <SearchIcon />
          </button>
        </div>
      </div>
      <div v-else class="settings-header">
        <button type="button" class="settings-back" data-testid="settings-back" @click="backToIndex">
          <span class="text-body-m settings-back-arrow">&lsaquo;</span>
          <span class="text-body-s">Settings</span>
        </button>
      </div>

      <div class="settings-layout">

        <!-- Settings menu (desktop) / index (≤ 1024px) -->
        <nav v-if="showIndex" class="settings-nav settings-scroll" :class="{ scrolling: scrollingArea === 'nav' }" aria-label="Settings sections" @scroll.passive="onAreaScroll('nav')">
          <div v-for="group in visibleGroups" :key="group.key" class="settings-nav-group" :data-testid="`settings-group-${group.key}`">
            <span class="text-overline settings-group-title">{{ group.title }}</span>
            <div class="settings-nav-list" :class="{ card: isCompact }">
              <button
                  v-for="section in group.sections"
                  :key="section.key"
                  type="button"
                  class="settings-nav-item"
                  :class="[isCompact ? 'text-body-m' : 'text-label', { 'settings-nav-item--active': !isCompact && section.key === activeKey }]"
                  :aria-current="!isCompact && section.key === activeKey ? 'page' : null"
                  :data-testid="`settings-nav-${section.key}`"
                  @click="openSection(section.key)"
              >
                <span class="settings-nav-body">
                  <span :class="{ 'fw-semibold settings-nav-title': isCompact }">{{ section.title }}</span>
                  <span v-if="isCompact" class="text-body-s color-text-secondary">{{ section.description }}</span>
                </span>
                <ChevronRightIcon v-if="isCompact" class="settings-nav-chevron" />
              </button>
            </div>
          </div>
          <p v-if="!visibleSections.length" class="settings-empty" data-testid="settings-no-match">No settings match “{{ searchQuery.trim() }}”.</p>
        </nav>

        <!-- Section pane (desktop) / section screen (≤ 1024px) -->
        <div v-if="!isCompact || !showIndex" ref="paneScroll" class="settings-pane-scroll settings-scroll" :class="{ scrolling: scrollingArea === 'pane' }" @scroll.passive="onAreaScroll('pane')">
          <div v-if="!activeSection" class="settings-pane settings-loading">
            <Spinner :size="16" />
            <span>Loading...</span>
          </div>

          <section v-else class="settings-pane" :data-section="activeKey" :data-testid="activeKey === 'assistant' ? 'settings-assistant' : null">
            <div class="settings-pane-head">
              <div class="settings-title-row">
                <component :is="isCompact ? 'h1' : 'h2'" class="settings-section-title" :class="isCompact ? 'page-title' : 'text-h3'">{{ activeSection.title }}</component>
                <Badge v-if="sectionStatus" :type="sectionStatus.type" :data-testid="`settings-status-${activeKey}`">{{ sectionStatus.label }}</Badge>
              </div>
              <p class="text-body-s color-text-secondary settings-section-description">{{ activeSection.description }}</p>
            </div>

            <!-- Account -->
            <div v-if="activeKey === 'account'" class="card">
              <div class="settings-section-body">
                <div class="settings-row">
                  <span class="settings-label">Email</span>
                  <span class="settings-value settings-email">{{ userEmail }}</span>
                </div>
                <div class="settings-row">
                  <span class="settings-label">Password</span>
                  <Btn variant="secondary" size="sm" @click="openPasswordModal">Change password</Btn>
                </div>
                <div class="settings-row">
                  <div>
                    <span class="settings-label">Delete account</span>
                    <p class="text-body-s settings-hint">Permanently deletes your account and all your data</p>
                  </div>
                  <Btn variant="ghost-danger" size="sm" data-testid="settings-delete-account" @click="openDeleteModal">Delete</Btn>
                </div>
              </div>
            </div>

            <!-- Plan -->
            <div v-else-if="activeKey === 'plan'" class="card">
              <div v-if="confirmingPayment" class="settings-section-body">
                <div class="settings-loading">
                  <Spinner :size="16" />
                  <span>Confirming your payment...</span>
                </div>
              </div>
              <div v-else class="settings-section-body">
                <div v-if="paymentStillProcessing && tier === 'free'" class="settings-row">
                  <p class="text-body-s settings-hint">Your payment is still being processed — your plan will update once it's confirmed. Card payments confirm within minutes; bank debits (SEPA) can take up to 6 business days.</p>
                </div>
                <div class="settings-row">
                  <div>
                    <span class="settings-label fw-semibold"><span :class="{ 'color-text-success': tier === 'team' }">{{ tierLabel }} plan</span></span>
                    <p v-if="planHint" class="text-body-s settings-hint">{{ planHint }}</p>
                  </div>
                  <Btn v-if="planUpgrade" variant="primary" size="sm" @click="paymentsEnabled ? router.push({ name: 'upgrade' }) : onContactSupport()">{{ paymentsEnabled ? 'Upgrade' : 'Contact Us' }}</Btn>
                </div>
                <div v-if="tierLimits && tierLimits.max_projects !== -1" class="settings-row">
                  <span class="settings-label">Projects</span>
                  <span class="settings-value">{{ stats?.projects?.count ?? 0 }} / {{ tierLimits.max_projects }}</span>
                </div>
                <div v-if="tierLimits && tierLimits.max_tags !== -1" class="settings-row">
                  <span class="settings-label">Tags</span>
                  <span class="settings-value">{{ stats?.tags?.count ?? 0 }} / {{ tierLimits.max_tags }}</span>
                </div>
                <div v-if="tierLimits && tierLimits.max_storage_bytes !== -1" class="settings-row">
                  <span class="settings-label">Storage</span>
                  <span class="settings-value">{{ formatBytes(stats?.reference?.used_bytes ?? 0) }} / {{ formatBytes(tierLimits.max_storage_bytes) }}</span>
                </div>
                <div v-if="tierLimits && tierLimits.max_projects === -1" class="settings-row">
                  <span class="settings-label">Limits</span>
                  <span class="settings-value">Unlimited</span>
                </div>

                <template v-if="paymentsEnabled">
                  <div v-if="payment.state.loading && !payment.state.loaded" class="settings-loading">
                    <Spinner :size="16" />
                    <span>Loading subscription...</span>
                  </div>

                  <template v-else-if="payment.state.loaded">
                    <div class="settings-row">
                      <span class="settings-label">Billing history</span>
                      <Btn variant="secondary" size="sm" @click="router.push({ name: 'billing-history' })">View</Btn>
                    </div>

                    <!-- No change-plan UI: switch plans by cancelling, then upgrading after expiry -->
                    <div v-if="hasActiveSubscription && !payment.state.cancelAtPeriodEnd" class="settings-row">
                      <div>
                        <span class="settings-label">Cancel subscription</span>
                        <p class="text-body-s settings-hint">Stops auto-renew — you keep access until the expiration date</p>
                      </div>
                      <Btn variant="ghost-danger" size="sm" :disabled="payment.state.acting" @click="onCancelSubscription">Cancel</Btn>
                    </div>
                  </template>
                </template>
              </div>
            </div>

            <!-- AI Assistant -->
            <div v-else-if="activeKey === 'assistant'" class="card">
              <div class="settings-section-body">
                <div v-if="!aiAccount && (aiLoading || !assistant.state.accountError)" class="settings-loading">
                  <Spinner :size="16" />
                  <span>Loading AI assistant...</span>
                </div>

                <div v-else-if="!aiAccount" class="settings-error">
                  <span>Couldn't load your AI assistant settings.</span>
                  <Btn variant="secondary" size="sm" @click="loadAssistant">Retry</Btn>
                </div>

                <template v-else>
                  <div v-if="confirmingCredits" class="settings-loading">
                    <Spinner :size="16" />
                    <span>Confirming your payment...</span>
                  </div>
                  <template v-else>
                    <div v-if="creditsStillProcessing" class="settings-row">
                      <p class="text-body-s settings-hint">Your payment is still being processed — your credits will appear once it's confirmed. Card payments confirm within minutes; bank debits (SEPA) can take up to 6 business days.</p>
                    </div>
                    <div class="settings-row">
                      <div>
                        <span class="settings-label">Credits left</span>
                        <p v-if="assistant.selectedModel.value" class="text-body-s settings-hint">About {{ aiAccount.requests_left.toLocaleString('en-US') }} requests with {{ assistant.selectedModel.value.name }}</p>
                      </div>
                      <span class="settings-value fw-semibold" data-testid="assistant-credits-total">{{ aiAccount.total.toLocaleString('en-US') }}</span>
                    </div>
                    <div class="settings-row">
                      <div>
                        <span class="settings-label">Monthly credits</span>
                        <p class="text-body-s settings-hint">Refills on {{ formatLocalDay(aiAccount.monthly_resets_at) }}</p>
                      </div>
                      <span class="settings-value">{{ aiAccount.monthly_left.toLocaleString('en-US') }} of {{ aiAccount.monthly_allowance.toLocaleString('en-US') }}</span>
                    </div>
                    <div v-if="aiAccount.purchased_left > 0" class="settings-row">
                      <div>
                        <span class="settings-label">Extra credits</span>
                        <p v-if="aiAccount.purchased_next_expiry" class="text-body-s settings-hint">{{ aiAccount.purchased_next_expiry.credits.toLocaleString('en-US') }} expire on {{ formatDay(aiAccount.purchased_next_expiry.date) }}</p>
                      </div>
                      <span class="settings-value">{{ aiAccount.purchased_left.toLocaleString('en-US') }}</span>
                    </div>
                  </template>
                  <div class="settings-row">
                    <div>
                      <span class="settings-label">Buy credits</span>
                      <p class="text-body-s settings-hint">One-time packs, used after your monthly credits</p>
                    </div>
                    <Btn v-if="paymentsEnabled" variant="primary" size="sm" @click="router.push({ name: 'buy-credits' })">Buy</Btn>
                    <Btn v-else variant="primary" size="sm" @click="onContactSupport">Contact Us</Btn>
                  </div>
                  <div class="settings-row" :class="{ 'settings-row--column': isMobile }">
                    <div>
                      <span class="settings-label">Model</span>
                      <p class="text-body-s settings-hint">Bigger models think better and use more credits.</p>
                    </div>
                    <div class="settings-control assistant-model" :class="{ 'settings-control--saving': aiModelSaving }">
                      <span v-if="aiModelSaving" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                      <Select v-model="aiModelId" :options="aiModelOptions" title="Model" block />
                    </div>
                  </div>
                  <div class="settings-row">
                    <div>
                      <span class="settings-label">Memory</span>
                      <p class="text-body-s settings-hint">What the assistant has noted about how you work</p>
                    </div>
                    <Btn variant="secondary" size="sm" data-testid="assistant-memory-view" @click="showMemoryModal = true">View</Btn>
                  </div>
                </template>
              </div>
            </div>

            <!-- Sessions -->
            <div v-else-if="activeKey === 'sessions'" class="card">
              <div class="settings-section-body">
                <div v-if="loadingSessions" class="settings-loading">
                  <Spinner :size="16" />
                  <span>Loading sessions...</span>
                </div>

                <div v-else-if="sessionsError" class="settings-error">
                  <span>{{ sessionsError }}</span>
                  <Btn variant="secondary" size="sm" @click="loadSessions">Retry</Btn>
                </div>

                <div v-else-if="sessions.length === 0" class="settings-empty">
                  No active sessions found.
                </div>

                <div v-else class="sessions-list">
                  <div v-for="session in sessions" :key="session.id" class="session-item">
                    <div class="session-info">
                      <div class="session-device">
                        <span class="fw-medium session-name">{{ session.device || 'Unknown Device' }}</span>
                        <Badge v-if="session.is_current" type="primary">Current</Badge>
                      </div>
                      <div class="text-body-s session-details">
                        <template v-for="(segment, index) in sessionSegments(session)" :key="index">
                          <span v-if="index" class="session-separator">·</span>
                          <span class="session-segment">{{ segment }}</span>
                        </template>
                      </div>
                    </div>
                    <ActionBtn
                        v-if="session.is_current"
                        variant="primary"
                        :loading="loggingOut"
                        @click="onLogout"
                    />
                    <ActionBtn
                        v-else
                        variant="primary"
                        :loading="revokingId === session.id"
                        @click="onRevokeSession(session.id)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Application -->
            <template v-else-if="activeKey === 'application'">
              <div class="card">
                <div class="settings-section-body">
                  <div class="notif-group-header">
                    <span class="text-overline notif-group-name">Appearance</span>
                  </div>
                  <div class="settings-row" :class="{ 'settings-row--column': isMobile }">
                    <span class="settings-label">Theme</span>
                    <div class="settings-control">
                      <SegmentSwitch v-model="themeMode" :options="themeModeOptions" />
                    </div>
                  </div>

                  <div class="notif-group-header">
                    <span class="text-overline notif-group-name">Lists</span>
                  </div>
                  <div class="settings-row">
                    <div>
                      <span class="settings-label">New items go to</span>
                      <p class="text-body-s settings-hint">Where new items appear in your lists</p>
                    </div>
                    <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.newItemsPosition }">
                      <span v-if="settings.state.saving.newItemsPosition" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                      <SegmentSwitch v-model="addPosition" :options="positionOptions" />
                    </div>
                  </div>
                  <div class="settings-row settings-row--column">
                    <div class="settings-row-head">
                      <div>
                        <span class="settings-label">Quick-add tags</span>
                        <p class="text-body-s settings-hint">Suggested under the tag field. Leave empty to use the defaults.</p>
                      </div>
                      <Btn v-if="!editingTagPresets" variant="ghost" size="sm" data-testid="settings-tags-edit" @click="startTagPresetsEdit">Edit</Btn>
                    </div>
                    <template v-if="!editingTagPresets">
                      <span v-if="settings.state.tagPresets.length > 0" class="settings-tags-chips">
                        <span v-for="tag in settings.state.tagPresets" :key="tag" class="text-body-s settings-tag-chip">{{ tag }}</span>
                      </span>
                      <span v-else class="text-body-s settings-hint">No quick-add tags yet — the defaults are used.</span>
                    </template>
                    <template v-else>
                      <TagInput ref="tagPresetsInput" v-model="editTagPresets" placeholder="Add preset tags..." :presetSource="defaultPresets" />
                      <div class="settings-tag-actions">
                        <Btn
                            variant="primary"
                            size="sm"
                            :disabled="savingTagPresets"
                            :loading="savingTagPresets"
                            @mousedown.prevent
                            @click="saveTagPresets"
                        >Save</Btn>
                        <Btn
                            variant="secondary"
                            size="sm"
                            :disabled="savingTagPresets"
                            @mousedown.prevent
                            @click="cancelTagPresetsEdit"
                        >Cancel</Btn>
                      </div>
                    </template>
                  </div>

                  <div class="notif-group-header">
                    <span class="text-overline notif-group-name">Time</span>
                  </div>
                  <div class="settings-row" :class="{ 'settings-row--column': isMobile }">
                    <div>
                      <span class="settings-label">Timezone</span>
                      <p class="text-body-s settings-hint">Used for day-scoped views and your daily digest email</p>
                    </div>
                    <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.timezone }">
                      <span v-if="settings.state.saving.timezone" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                      <Select v-model="timezone" :options="timezoneOptions" title="Timezone" />
                    </div>
                  </div>

                  <div class="notif-group-header">
                    <span class="text-overline notif-group-name">Reflect</span>
                  </div>
                  <div class="settings-row">
                    <div>
                      <span class="settings-label">Weekly Review</span>
                      <p class="text-body-s settings-hint">Show the Weekly Review section in the sidebar</p>
                    </div>
                    <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.reviewEnabled }">
                      <span v-if="settings.state.saving.reviewEnabled" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                      <label class="settings-toggle">
                        <input type="checkbox" v-model="reviewEnabled" />
                        <span class="settings-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                  <div class="settings-row">
                    <div>
                      <span class="settings-label">Horizons of Focus</span>
                      <p class="text-body-s settings-hint">Show areas, goals, vision and purpose in the sidebar, on projects, on Engage and in the Weekly Review</p>
                    </div>
                    <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.horizonsEnabled }">
                      <span v-if="settings.state.saving.horizonsEnabled" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                      <label class="settings-toggle">
                        <input type="checkbox" v-model="horizonsEnabled" data-testid="settings-horizons-toggle" />
                        <span class="settings-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <p class="text-caption color-text-tertiary settings-version" data-testid="settings-version">Version {{ appVersion }}</p>
            </template>

            <!-- Calendar -->
            <div v-else-if="activeKey === 'calendar'" class="card">
              <div class="settings-section-body">
                <div class="settings-row">
                  <span class="settings-label">Week starts on</span>
                  <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.weekStart }">
                    <span v-if="settings.state.saving.weekStart" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                    <SegmentSwitch v-model="weekStart" :options="weekStartOptions" />
                  </div>
                </div>

                <div class="settings-row">
                  <span class="settings-label">Time format</span>
                  <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.timeFormat }">
                    <span v-if="settings.state.saving.timeFormat" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                    <SegmentSwitch v-model="timeFormat" :options="timeFormatOptions" />
                  </div>
                </div>

                <div class="settings-row">
                  <span class="settings-label">Business hours</span>
                  <div class="settings-hours">
                    <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.businessHoursStart }">
                      <span v-if="settings.state.saving.businessHoursStart" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                      <Select v-model="businessHoursStart" :options="hourOptions" title="Start hour" data-testid="settings-business-hours-start" />
                    </div>
                    <span class="color-text-tertiary">–</span>
                    <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.businessHoursEnd }">
                      <span v-if="settings.state.saving.businessHoursEnd" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                      <Select v-model="businessHoursEnd" :options="hourOptions" title="End hour" data-testid="settings-business-hours-end" />
                    </div>
                  </div>
                </div>

                <div class="settings-row settings-row--column">
                  <span class="settings-label">Business days</span>
                  <div class="settings-days-control" :class="{ 'settings-control--saving': settings.state.saving.businessDays }">
                    <span v-if="settings.state.saving.businessDays" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                    <div class="settings-days">
                      <label v-for="day in dayOptions" :key="day.value" class="text-body-s settings-day-checkbox">
                        <input
                            type="checkbox"
                            :value="day.value"
                            v-model="businessDays"
                        />
                        <span>{{ day.label }}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notifications -->
            <div v-else-if="activeKey === 'notifications'" class="card">
              <div class="settings-section-body">
                <div v-if="notifications.state.loading && !notifications.state.loaded" class="settings-loading">
                  <Spinner :size="16" />
                  <span>Loading notification settings...</span>
                </div>

                <div v-else-if="notifications.state.error" class="settings-error">
                  <span>Couldn't load your notification settings. Check your connection and try again.</span>
                  <Btn variant="ghost" size="sm" @click="notifications.load()">Try again</Btn>
                </div>

                <template v-else>
                  <div class="settings-row">
                    <div class="notif-row-text">
                      <span class="settings-label">Email notifications</span>
                      <p class="text-body-s settings-hint">Turn off to stop every email below. Security and billing emails still come.</p>
                    </div>
                    <div class="settings-control" :class="{ 'settings-control--saving': notifications.state.saving.emailEnabled }">
                      <span v-if="notifications.state.saving.emailEnabled" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                      <label class="settings-toggle">
                        <input type="checkbox" :checked="notifications.state.emailEnabled" aria-label="Email notifications" @change="onEmailEnabledToggle($event)" />
                        <span class="settings-toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div class="settings-row" data-testid="push-device-row">
                    <div class="notif-row-text">
                      <span class="settings-label">Web notifications on this device</span>
                      <p class="text-body-s settings-hint">{{ deviceHint }}</p>
                    </div>
                    <div class="settings-control" :class="{ 'settings-control--saving': notifications.state.deviceBusy }">
                      <span v-if="notifications.state.deviceBusy" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                      <label class="settings-toggle">
                        <input type="checkbox" :checked="notifications.state.device === 'on'" :disabled="!['on', 'off'].includes(notifications.state.device)" aria-label="Web notifications on this device" @change="onDeviceToggle($event)" />
                        <span class="settings-toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <template v-for="group in notificationGroups" :key="group.name">
                    <div class="notif-group-header">
                      <span class="text-overline notif-group-name">{{ group.name }}</span>
                      <div class="notif-columns">
                        <span class="text-caption notif-column-label">Email</span>
                        <span class="text-caption notif-column-label">Web</span>
                      </div>
                    </div>

                    <div v-for="row in group.events" :key="row.event" class="settings-row" :data-testid="`notif-row-${row.event}`">
                      <div class="notif-row-text">
                        <span class="settings-label">{{ row.label }}</span>
                        <p v-if="row.hint" class="text-body-s settings-hint">{{ row.hint }}</p>
                      </div>
                      <div class="notif-columns">
                        <div class="settings-control" :class="{ 'settings-control--saving': notifications.state.saving[`email:${row.event}`] }">
                          <span v-if="notifications.state.saving[`email:${row.event}`]" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                          <label class="settings-toggle">
                            <input type="checkbox" :checked="notifications.state.email[row.event]" :disabled="!notifications.state.emailEnabled" :aria-label="`${row.label} by email`" @change="onEventToggle('email', row.event, $event)" />
                            <span class="settings-toggle-slider"></span>
                          </label>
                        </div>
                        <div v-if="row.web !== false" class="settings-control" :class="{ 'settings-control--saving': notifications.state.saving[`web:${row.event}`] }">
                          <span v-if="notifications.state.saving[`web:${row.event}`]" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                          <label class="settings-toggle">
                            <input type="checkbox" :checked="notifications.state.web[row.event]" :aria-label="`${row.label} on the web`" @change="onEventToggle('web', row.event, $event)" />
                            <span class="settings-toggle-slider"></span>
                          </label>
                        </div>
                        <span v-else class="notif-column-label"></span>
                      </div>
                    </div>
                  </template>

                  <p class="text-caption color-text-tertiary settings-info-note">The bell is always on. Security alerts and failed payments can't be turned off — they always come by email and to every device with notifications on. Service notices (terms, maintenance, security) always come by email.</p>
                </template>
              </div>
            </div>

            <!-- Email to Inbox -->
            <div v-else-if="activeKey === 'emailInbox'" class="card">
              <div class="settings-section-body">
                <div v-if="!isProOrTeam" class="settings-row">
                  <span class="settings-value">Available on Pro and Team plans.</span>
                  <Btn variant="primary" size="sm" @click="paymentsEnabled ? onUpgradeEmail() : onContactSupport()">{{ paymentsEnabled ? 'Upgrade' : 'Contact Us' }}</Btn>
                </div>

                <template v-else>
                  <div v-if="inbox.loading && !inbox.loaded" class="settings-loading">
                    <Spinner :size="16" />
                    <span>Loading...</span>
                  </div>

                  <div v-else-if="!inbox.address" class="settings-row" :class="{ 'settings-row--column': isMobile }">
                    <span class="text-body-s settings-hint">Get a private email address. Forward anything to capture it instantly.</span>
                    <Btn variant="primary" size="sm" :loading="inbox.acting" :disabled="inbox.acting" @click="onGenerateAddress">Generate address</Btn>
                  </div>

                  <template v-else>
                    <div class="settings-row settings-row--column">
                      <span class="settings-label">Your inbox address</span>
                      <div class="email-address-row">
                        <span class="settings-value email-address">{{ inbox.address }}</span>
                        <Btn variant="secondary" size="sm" @click="onCopyAddress">{{ copied === 'inbox' ? 'Copied!' : 'Copy' }}</Btn>
                      </div>
                      <div>
                        <p class="text-body-s settings-hint">Forward any email to this address to capture it as a new item.</p>
                        <p class="text-body-s settings-hint">Attachments are saved with the item within your plan's limits.</p>
                      </div>
                    </div>

                    <div class="settings-row">
                      <span class="settings-label">Used today</span>
                      <span class="settings-value">{{ inbox.emailsToday }} of {{ inbox.dailyLimit }}</span>
                    </div>

                    <div class="settings-row">
                      <span class="settings-label">Capture</span>
                      <div class="settings-control" :class="{ 'settings-control--saving': inbox.savingCapture }">
                        <span v-if="inbox.savingCapture" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                        <label class="settings-toggle">
                          <input type="checkbox" v-model="captureEnabled" aria-label="Capture" />
                          <span class="settings-toggle-slider"></span>
                        </label>
                      </div>
                    </div>

                    <div class="settings-row">
                      <span class="settings-label">Reset address</span>
                      <Btn variant="ghost" size="sm" :loading="inbox.acting" :disabled="inbox.acting" @click="onResetAddress">Reset</Btn>
                    </div>
                  </template>
                </template>
              </div>
            </div>

            <!-- AI Apps -->
            <div v-else-if="activeKey === 'aiApps'" class="card">
              <div class="settings-section-body">
                <div class="settings-row settings-row--column">
                  <span class="settings-label">Connect an AI app</span>
                  <div class="email-address-row">
                    <span class="settings-value email-address">{{ mcpUrl }}</span>
                    <Btn variant="secondary" size="sm" @click="copyAddress('mcp', mcpUrl)">{{ copied === 'mcp' ? 'Copied!' : 'Copy' }}</Btn>
                  </div>
                  <p class="text-body-s settings-hint">Add this address as a connector in Claude, ChatGPT or any AI app that supports MCP. You'll be asked to sign in and allow access.</p>
                </div>

                <div v-if="loadingAiApps" class="settings-loading">
                  <Spinner :size="16" />
                  <span>Loading AI apps...</span>
                </div>

                <div v-else-if="aiAppsError" class="settings-error">
                  <span>Couldn't load your AI apps.</span>
                  <Btn variant="secondary" size="sm" @click="loadAiApps">Retry</Btn>
                </div>

                <div v-else-if="aiApps.length === 0" class="settings-empty">
                  No AI apps connected yet.
                </div>

                <div v-else class="sessions-list">
                  <div v-for="app in aiApps" :key="app.id" class="session-item">
                    <div class="session-info">
                      <span class="fw-medium session-name">{{ app.name }}</span>
                      <span class="text-body-s session-details">Connected {{ formatConnectedDate(app.connected_at) }}</span>
                    </div>
                    <ActionBtn
                        variant="primary"
                        :loading="removingAiAppId === app.id"
                        @click="onRemoveAiApp(app)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Calendar Sync -->
            <div v-else-if="activeKey === 'calendarSync'" class="card" data-testid="calendar-sync-card">
              <div class="settings-section-body">
                <div v-if="!isProOrTeam" class="settings-row" data-testid="calendar-sync-lockout">
                  <span class="settings-value">Google Calendar sync is available on Pro and Team plans.</span>
                  <Btn variant="primary" size="sm" data-testid="calendar-sync-upgrade" @click="paymentsEnabled ? onUpgradeCalendarSync() : onContactSupport()">{{ paymentsEnabled ? 'Upgrade' : 'Contact Us' }}</Btn>
                </div>

                <template v-else>
                  <div v-if="gcal.loading && !gcal.loaded" class="settings-loading">
                    <Spinner :size="16" />
                    <span>Loading...</span>
                  </div>

                  <div v-else-if="!gcal.connected || gcal.reauth" class="settings-row" :class="{ 'settings-row--column': isMobile }">
                    <span class="text-body-s settings-hint">Show your scheduled actions in Google Calendar. Reschedules made on either side sync both ways.</span>
                    <Btn variant="primary" size="sm" :loading="gcal.acting" :disabled="gcal.acting" data-testid="calendar-sync-connect" @click="onConnectCalendar">{{ calendarNeedsReconnect ? 'Reconnect Google Calendar' : 'Connect Google Calendar' }}</Btn>
                  </div>

                  <template v-else>
                    <!-- Selected calendar removed in Google: sync paused -->
                    <div v-if="gcal.missing" class="settings-row" :class="{ 'settings-row--column': isMobile }" data-testid="calendar-sync-missing">
                      <span class="text-body-s settings-hint">Sync is paused and your actions are unchanged. Re-create the WhatsNextAction calendar or pick another calendar.</span>
                      <Btn variant="primary" size="sm" :loading="gcal.savingCalendar" :disabled="gcal.savingCalendar" data-testid="calendar-sync-recreate" @click="onCreateWnaCalendar">Re-create calendar</Btn>
                    </div>

                    <div class="settings-row" :class="{ 'settings-row--column': isMobile }">
                      <span class="settings-label">Calendar</span>
                      <div class="settings-control" :class="{ 'settings-control--saving': gcal.savingCalendar }">
                        <span v-if="gcal.savingCalendar" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                        <Select v-model="selectedCalendar" :options="calendarOptions" title="Calendar" data-testid="calendar-sync-picker" />
                      </div>
                    </div>

                    <div class="settings-row">
                      <div>
                        <span class="settings-label">Timezone</span>
                        <p class="text-body-s settings-hint" data-testid="calendar-sync-timezone">Timed events use your timezone, {{ timezoneLabel }}.</p>
                      </div>
                      <Btn variant="ghost" size="sm" data-testid="calendar-sync-timezone-change" @click="router.push({ name: 'settings', query: { section: 'application' } })">Change</Btn>
                    </div>

                    <div class="settings-row">
                      <span class="settings-label">What syncs</span>
                      <Btn variant="ghost" size="sm" data-testid="calendar-sync-learn-more" @click="showWhatSyncs = true">Learn more</Btn>
                    </div>

                    <div class="settings-row">
                      <span class="settings-label">Sync now</span>
                      <Btn variant="secondary" size="sm" :loading="gcal.syncing" :disabled="gcal.syncing" data-testid="calendar-sync-now" @click="onSyncCalendarNow">Sync now</Btn>
                    </div>

                    <div class="settings-row">
                      <span class="settings-label">Disconnect</span>
                      <Btn variant="ghost-danger" size="sm" :loading="gcal.acting" :disabled="gcal.acting" data-testid="calendar-sync-disconnect" @click="onDisconnectCalendar">Disconnect</Btn>
                    </div>
                  </template>
                </template>
              </div>
            </div>

            <!-- Storage -->
            <div v-else-if="activeKey === 'storage'" class="card" data-testid="drive-card">
              <div class="settings-section-body">
                <div v-if="drive.loading && !drive.loaded" class="settings-loading">
                  <Spinner :size="16" />
                  <span>Loading...</span>
                </div>

                <template v-else>
                  <div v-if="!drive.connected" class="settings-row" :class="{ 'settings-row--column': isMobile }">
                    <span class="text-body-s settings-hint">Store your reference files and attachments in your own Google Drive. Files saved there don't count toward your storage limit.</span>
                    <Btn variant="primary" size="sm" :loading="drive.acting" :disabled="drive.acting" data-testid="drive-connect" @click="onConnectDrive">Connect Google Drive</Btn>
                  </div>

                  <div v-else-if="drive.email" class="settings-row">
                    <span class="settings-label">Google Drive</span>
                    <span class="settings-value settings-email">{{ drive.email }}</span>
                  </div>

                  <div class="settings-row">
                    <span class="settings-label">Save attachments to</span>
                    <div class="settings-control" :class="{ 'settings-control--saving': drive.savingDestination }">
                      <span v-if="drive.savingDestination" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                      <SegmentSwitch v-model="attachmentsDestination" :options="destinationOptions" :disabled="!drive.connected" />
                    </div>
                  </div>

                  <div v-if="drive.connected" class="settings-row">
                    <span class="settings-label">Disconnect</span>
                    <Btn variant="ghost-danger" size="sm" :loading="drive.acting" :disabled="drive.acting" data-testid="drive-disconnect" @click="onDisconnectDrive">Disconnect</Btn>
                  </div>
                </template>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Modal :visible="showDeleteModal" title="Delete account" @close="closeDeleteModal">
        <div class="delete-account-body" data-testid="delete-account-modal">
          <p class="text-body-m color-text-secondary">This permanently deletes your account and everything in it, including the projects you share with others. This can't be undone.</p>
          <p v-if="hasActiveSubscription && !payment.state.cancelAtPeriodEnd" class="text-body-m color-text-secondary">Your paid subscription is cancelled too.</p>
          <p v-if="assistant.enabled.value && assistant.state.account?.purchased_left > 0" class="text-body-m color-text-secondary" data-testid="delete-account-ai-credits">Your unused extra AI credits are lost too.</p>
          <p class="text-body-m color-text-secondary">To confirm, type <strong class="delete-account-email color-text-primary">{{ userEmail }}</strong> below.</p>
          <Inpt ref="deleteEmailInput" v-model="deleteEmail" type="email" placeholder="Enter your email address"
                data-testid="delete-account-email" @enter="onDeleteAccount" />
        </div>
        <template #actions>
          <Btn variant="secondary" size="sm" :disabled="deletingAccount" @click="closeDeleteModal">Cancel</Btn>
          <Btn variant="danger" size="sm" :disabled="!deleteEmailMatches" :loading="deletingAccount"
               data-testid="delete-account-confirm" @click="onDeleteAccount">Delete account</Btn>
        </template>
      </Modal>

      <AssistantMemoryModal :visible="showMemoryModal" @close="showMemoryModal = false" />

      <Modal :visible="gcal.offerCreate" title="WhatsNextAction calendar" @close="onDeclineWnaCalendar">
        <div class="text-body-m color-text-secondary" data-testid="calendar-sync-create-modal">Create a WhatsNextAction calendar in your Google account and sync your scheduled actions there? Events you create in that calendar in Google become actions in WNA. You can change the calendar at any time.</div>
        <template #actions>
          <Btn variant="secondary" size="sm" data-testid="calendar-sync-create-no" @click="onDeclineWnaCalendar">No</Btn>
          <Btn variant="primary" size="sm" data-testid="calendar-sync-create-yes" @click="onAcceptWnaCalendar">Yes</Btn>
        </template>
      </Modal>

      <Modal :visible="showWhatSyncs" title="What syncs" max-width="480px" @close="showWhatSyncs = false">
        <p class="text-body-m color-text-secondary" data-testid="calendar-sync-what-syncs">Scheduled actions in Next, Today, Calendar and Waiting For: title, description, date and time. Changes made in Google to these events come back to WNA, and deleting one in Google moves its action to Trash. In the WhatsNextAction calendar, events you create in Google become scheduled actions, and each occurrence of a recurring event in the next 30 days becomes its own action. Due dates, start dates and your other Google events do not sync. Completing or trashing an action removes its event.</p>
        <template #actions>
          <Btn variant="secondary" size="sm" @click="showWhatSyncs = false">Close</Btn>
        </template>
      </Modal>

      <!-- Change Password Modal -->
      <Teleport to="body" v-if="showPasswordModal">
        <div class="password-modal-overlay" :class="{ 'password-modal-overlay--fullscreen': isMobile }">
          <div class="password-modal" :class="{ 'password-modal--fullscreen': isMobile }">
            <div class="password-modal-header">
              <h2 class="text-h3 password-modal-title">Change Password</h2>
              <button class="password-modal-close" @click="closePasswordModal">&times;</button>
            </div>

            <div class="password-modal-body">
              <Inpt
                  ref="currentPasswordInput"
                  v-model="currentPassword"
                  v-model:error="currentPasswordError"
                  type="password"
                  title="Current Password"
                  placeholder="Enter current password"
                  @enter="onChangePassword"
              />

              <Inpt
                  v-model="newPassword"
                  v-model:error="newPasswordError"
                  type="password"
                  title="New Password"
                  placeholder="Enter new password"
                  footer="Use 8 or more characters with a mix of letters, numbers and symbols"
                  @enter="onChangePassword"
              />

              <Inpt
                  v-model="confirmPassword"
                  v-model:error="confirmPasswordError"
                  type="password"
                  title="Confirm New Password"
                  placeholder="Confirm new password"
                  @enter="onChangePassword"
              />

              <p class="text-body-s settings-hint password-modal-hint">Other devices and your connected AI apps will be signed out.</p>
            </div>

            <div class="password-modal-footer">
              <Btn variant="secondary" size="md" @click="closePasswordModal" :disabled="changingPassword">
                Cancel
              </Btn>
              <Btn
                  variant="primary"
                  size="md"
                  :loading="changingPassword"
                  :disabled="!canChangePassword"
                  @click="onChangePassword"
              >
                Change Password
              </Btn>
            </div>
          </div>
        </div>
      </Teleport>

    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import SearchIcon from '../../assets/SearchIcon.vue'
import ChevronRightIcon from '../../assets/ChevronRightIcon.vue'
import Badge from '../../components/Badge.vue'
import SegmentSwitch from '../../components/SegmentSwitch.vue'
import Btn from '../../components/Btn.vue'
import Inpt from '../../components/Inpt.vue'
import ActionBtn from '../../components/ActionBtn.vue'
import Select from '../../components/Select.vue'
import Modal from '../../components/Modal.vue'
import TagInput from '../../components/TagInput.vue'
import { DEFAULT_PRESETS } from '../../scripts/models/tagModel.js'
import { authModel } from '../../scripts/core/authModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'
import { settingsModel } from '../../scripts/models/settingsModel.js'
import { isValidPassword } from '../../scripts/core/authTools.js'
import { mapApiError, ErrorScenario } from '../../scripts/core/errorMapper.js'
import { changePassword, listSessions, revokeSession, revokeAllSessions, listAiApps, removeAiApp, getInboxEmail, generateInboxEmail, regenerateInboxEmail, setInboxEmailEnabled, getGoogleStatus, startGoogleConnect, disconnectGoogle, listGoogleCalendars, selectGoogleCalendar, createWnaCalendar, syncCalendarNow, getStorageSettings, updateStorageSettings } from '../../scripts/core/apiClient.js'
import { upgradeModel } from '../../scripts/core/upgradeModel.js'
import { copyText } from '../../scripts/core/clipboardUtils.js'
import { getDomains } from '../../scripts/core/domains.js'
import { notificationModel, NOTIFICATION_GROUPS } from '../../scripts/models/notificationModel.js'
import { themeModel } from '../../scripts/models/themeModel.js'
import { statsModel } from '../../scripts/models/statsModel.js'
import { flagsModel } from '../../scripts/core/flagsModel.js'
import { paymentModel } from '../../scripts/models/paymentModel.js'
import { format, parseISO } from 'date-fns'
import Spinner from '../../components/Spinner.vue'
import AssistantMemoryModal from '../../components/AssistantMemoryModal.vue'
import { assistantModel, ASSISTANT_POLL_MS, CREDITS_BEFORE_CHECKOUT_KEY } from '../../scripts/models/assistantModel.js'

const router = useRouter()
const route = useRoute()
const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()
const settings = settingsModel()
const notifications = notificationModel()
const theme = themeModel()

const { stats, loadStats } = statsModel()
const { paymentsEnabled, hasFlag, loaded: flagsLoaded } = flagsModel()
const payment = paymentModel()
const assistant = assistantModel()

// Search
const searchVisible = ref(false)
const searchInput = ref(null)
const searchQuery = ref('')

function toggleSearch() {
  searchVisible.value = !searchVisible.value
  if (searchVisible.value) {
    nextTick(() => searchInput.value?.focus?.() || searchInput.value?.focus())
  } else {
    searchQuery.value = ''
  }
}

const GROUPS = [
  { key: 'account', title: 'Account' },
  { key: 'preferences', title: 'Preferences' },
  { key: 'integrations', title: 'Integrations' },
]

// Order = menu / index order; keywords = search terms (case-insensitive substring)
const SECTIONS = [
  { group: 'account', key: 'account', title: 'Account', description: 'Your sign-in email and password.',
    keywords: 'account email password login delete remove' },
  { group: 'account', key: 'plan', title: 'Plan', description: 'Your plan and what you use of it.',
    keywords: 'plan tier subscription free pro team projects tags storage limits upgrade billing renew cancel payment invoice' },
  { group: 'account', key: 'assistant', title: 'AI Assistant', description: 'Credits, model and memory of the built-in assistant.',
    keywords: 'ai assistant credits buy pack model memory conversation' },
  { group: 'account', key: 'sessions', title: 'Sessions', description: 'Devices signed in to your account.',
    keywords: 'sessions devices logout active current' },
  { group: 'preferences', key: 'application', title: 'Application', description: 'How WhatsNextAction looks and works for you.',
    keywords: 'application theme dark light system position new items top bottom timezone time zone tags presets quick add reflect review weekly sidebar horizons focus areas goals vision purpose about version' },
  { group: 'preferences', key: 'calendar', title: 'Calendar', description: 'Your week and working hours.',
    keywords: 'calendar week start time format business hours days' },
  { group: 'preferences', key: 'notifications', title: 'Notifications', description: 'What we tell you, by email and on the web.',
    keywords: 'notifications email reminder daily digest next actions project announcements push web browser device phone' },
  { group: 'integrations', key: 'emailInbox', title: 'Email to Inbox', description: 'Forward emails straight into your Inbox.',
    keywords: 'email inbox capture address forward generate reset pause' },
  { group: 'integrations', key: 'aiApps', title: 'AI Apps', description: 'Use your data from Claude, ChatGPT and other AI apps.',
    keywords: 'ai apps mcp claude chatgpt connector connected assistant' },
  { group: 'integrations', key: 'calendarSync', title: 'Calendar Sync', description: 'Two-way sync with Google Calendar.',
    keywords: 'calendar sync google connect disconnect reconnect sync now events timezone' },
  { group: 'integrations', key: 'storage', title: 'Storage', description: 'Keep files in your own Google Drive.',
    keywords: 'storage google drive connect disconnect reconnect attachments reference files local' },
]

// Links to merged or renamed sections; the Paywiser checkout returns to /settings/billing
const SECTION_ALIASES = { billing: 'plan', review: 'application', tags: 'application', about: 'application' }

function available(key) {
  switch (key) {
    case 'plan':
    case 'emailInbox': return !!tier.value
    case 'assistant': return assistant.enabled.value
    case 'calendarSync': return !!tier.value && hasFlag('calendar')
    case 'storage': return !!tier.value && hasFlag('drive')
    default: return true
  }
}

const visibleSections = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return SECTIONS.filter(s => available(s.key) && (!q || s.keywords.includes(q)))
})

const visibleGroups = computed(() => GROUPS
    .map(group => ({ ...group, sections: visibleSections.value.filter(s => s.group === group.key) }))
    .filter(group => group.sections.length))

// ≤ 1024px: an index screen and one screen per section; wider: a menu beside the section pane
const compactQuery = window.matchMedia('(max-width: 1024px)')
const isCompact = ref(compactQuery.matches)

function onCompactChange(e) {
  isCompact.value = e.matches
}

const requestedSection = computed(() => {
  const key = route.query.section
  if (typeof key !== 'string') return null
  const resolved = SECTION_ALIASES[key] || key
  return SECTIONS.some(s => s.key === resolved) ? resolved : null
})

// Flag-gated sections are unknown until the public flags load (the Google connect return lands before that)
const sectionPending = computed(() =>
    !!requestedSection.value && !available(requestedSection.value) && !flagsLoaded.value)

const activeKey = computed(() => {
  if (requestedSection.value && available(requestedSection.value)) return requestedSection.value
  if (sectionPending.value || isCompact.value) return null
  return 'account'
})

const activeSection = computed(() => SECTIONS.find(s => s.key === activeKey.value) || null)

const showIndex = computed(() => !isCompact.value || (!activeKey.value && !sectionPending.value))

function openSection(key) {
  const to = { name: 'settings', query: { section: key } }
  if (isCompact.value) router.push(to)
  else router.replace(to)
}

function onSearchEnter() {
  if (visibleSections.value.length) openSection(visibleSections.value[0].key)
}

function backToIndex() {
  router.push({ name: 'settings' })
}

// Auto-hiding scrollbar
const paneScroll = ref(null)
const scrollingArea = ref(null)
let areaScrollTimer = null

function onAreaScroll(area) {
  scrollingArea.value = area
  clearTimeout(areaScrollTimer)
  areaScrollTimer = setTimeout(() => { scrollingArea.value = null }, 1000)
}

// User data
const userEmail = computed(() => auth.currentUser.value?.email || '')

// Plan
const tier = computed(() => auth.currentUser.value?.subscription_tier)
const tierLimits = computed(() => auth.currentUser.value?.tier_limits)
const tierLabel = computed(() => {
  const t = tier.value
  if (t === 'pro') return 'Pro'
  if (t === 'team') return 'Team'
  return 'Free'
})
function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

// Payment & billing
const hasActiveSubscription = computed(() =>
    payment.state.tier !== 'free' && ['active', 'past_due'].includes(payment.state.status))

const planHint = computed(() => {
  if (hasActiveSubscription.value) {
    return `${payment.state.cancelAtPeriodEnd ? 'Access until' : 'Renews on'} ${formatBillingDate(payment.state.expiresAt)}`
  }
  return tier.value === 'free' ? 'Unlock Pro or Team features' : ''
})

// A paid tier granted without a subscription (admin) gets no upgrade
const planUpgrade = computed(() =>
    tier.value === 'free' && !hasActiveSubscription.value && (!paymentsEnabled.value || payment.state.loaded))

// Post-checkout convergence — poll numbers homed in wna_orchestration/contracts/limits.md
const CONVERGE_POLL_MS = 2000
const CONVERGE_MAX_ATTEMPTS = 15
const confirmingPayment = ref(false)
const paymentStillProcessing = ref(false)

// expires_at arrives as UTC "YYYY-MM-DD HH:MM:SS"
function formatBillingDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val.replace(' ', 'T') + 'Z'), 'MMM d, yyyy') } catch { return val }
}

async function loadPaymentStatus() {
  if (!paymentsEnabled.value || payment.state.loading) return
  try {
    await payment.loadStatus()
  } catch (err) {
    toaster.push(err.message || 'Failed to load subscription')
  }
}

async function onCancelSubscription() {
  const confirmed = await confirm.show({
    title: 'Cancel subscription',
    message: `Cancel your subscription? Auto-renew stops and you keep access until ${formatBillingDate(payment.state.expiresAt)}.`,
    confirmText: 'Cancel subscription',
    cancelText: 'Keep subscription',
  })
  if (!confirmed) return

  try {
    await payment.cancel()
    toaster.success('Subscription cancelled — access continues until expiration')
  } catch (err) {
    toaster.push(err.message || 'Failed to cancel subscription')
  }
}

// The gateway's hosted checkout returns to /settings/billing?status=… (a credit pack to /settings/assistant?status=…)
async function applyCheckoutReturn() {
  const status = route.query.status
  if (!status) return
  const query = {...route.query}
  delete query.status
  router.replace({query})

  if (route.query.section === 'assistant') return applyCreditsReturn(status)
  if (status === 'success') {
    toaster.success('Payment submitted — confirming with the payment provider…')
    await convergeAfterCheckout()
  } else if (status === 'failure') {
    toaster.push('Payment failed — you have not been charged. Please try again.')
  } else if (status === 'cancel') {
    toaster.push('Checkout cancelled — your plan is unchanged.')
  }
}

// The redirect carries no authority — the tier flips only when the paid webhook lands, so poll
// until it does (bounded). payment.loadStatus() is called directly: the loadPaymentStatus()
// guards (in-flight load, flags not loaded yet) would silently drop the refetch.
async function convergeAfterCheckout() {
  confirmingPayment.value = true
  try {
    try { await auth.refreshToken() } catch { /* the poll below still lands the user object */ }
    for (let attempt = 0; attempt < CONVERGE_MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await new Promise(resolve => setTimeout(resolve, CONVERGE_POLL_MS))
      if (!auth.isAuthenticated.value) return
      try {
        await Promise.all([auth.loadUser(), payment.loadStatus()])
      } catch { /* transient — keep polling */ }
      if (tier.value && tier.value !== 'free') {
        try { await auth.refreshToken() } catch { /* the JWT tier catches up on the next rotation */ }
        return
      }
    }
    paymentStillProcessing.value = true
  } finally {
    confirmingPayment.value = false
  }
}

// AI assistant
const aiAccount = computed(() => assistant.state.account)
const aiLoading = ref(false)
const aiModelId = ref(null)
const aiModelSaving = ref(false)
const showMemoryModal = ref(false)
const confirmingCredits = ref(false)
const creditsStillProcessing = ref(false)

const aiModelOptions = computed(() => (aiAccount.value?.models || []).map(m => ({
  value: m.id,
  label: `${m.name} · ${m.credits_per_request.toLocaleString('en-US')} credits per request`,
})))

async function loadAssistant() {
  if (!assistant.enabled.value) return
  aiLoading.value = true
  try {
    await assistant.loadAccount()
  } catch { /* the card shows the error with Retry */ }
  finally {
    aiLoading.value = false
  }
}

watch(() => aiAccount.value?.selected_model_id, (id) => { aiModelId.value = id ?? null }, { immediate: true })

watch(aiModelId, async (id) => {
  if (id == null || id === aiAccount.value?.selected_model_id) return
  aiModelSaving.value = true
  try {
    await assistant.setModel(id)
  } catch {
    toaster.push('Couldn\'t change the model. Try again.')
    aiModelId.value = aiAccount.value?.selected_model_id ?? null
  } finally {
    aiModelSaving.value = false
  }
})

// UTC instants shown as the user's local date
function formatLocalDay(iso) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'MMM d, yyyy') } catch { return iso }
}

// Plain dates ("2027-10-28") stay that date in every zone
function formatDay(day) {
  if (!day) return '—'
  try { return format(parseISO(day.slice(0, 10)), 'MMM d, yyyy') } catch { return day }
}

async function applyCreditsReturn(status) {
  if (status === 'success') {
    toaster.success('Payment submitted — confirming with the payment provider…')
    await convergeAfterCreditsCheckout()
  } else if (status === 'failure') {
    toaster.push('Payment failed — you have not been charged. Please try again.')
  } else if (status === 'cancel') {
    toaster.push('Checkout cancelled — nothing was bought.')
  }
}

// Credits arrive with the paid webhook — poll until the extra credits grow past what they were before checkout
async function convergeAfterCreditsCheckout() {
  const stored = sessionStorage.getItem(CREDITS_BEFORE_CHECKOUT_KEY)
  sessionStorage.removeItem(CREDITS_BEFORE_CHECKOUT_KEY)
  const before = stored === null ? null : Number(stored)
  confirmingCredits.value = true
  try {
    for (let attempt = 0; attempt < CONVERGE_MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await new Promise(resolve => setTimeout(resolve, ASSISTANT_POLL_MS))
      if (!auth.isAuthenticated.value) return
      try {
        const account = await assistant.loadAccount()
        if (before !== null && account.purchased_left > before) return
      } catch { /* transient — keep polling */ }
    }
    creditsStillProcessing.value = true
  } finally {
    confirmingCredits.value = false
  }
}

// Email to Inbox — Pro/Team only; reactive on tier so a downgrade reverts to locked
const isProOrTeam = computed(() => tier.value === 'pro' || tier.value === 'team')

const inbox = reactive({
  address: null,
  enabled: true,
  emailsToday: 0,
  dailyLimit: 0,
  loading: false,
  loaded: false,
  acting: false,         // generate / reset in flight
  savingCapture: false,  // capture toggle in flight
})

const copied = ref(null) // which address shows "Copied!": 'inbox' | 'mcp'
let copiedTimer = null

function applyInbox(data) {
  inbox.address = data.email || null
  inbox.enabled = data.enabled !== false
  inbox.emailsToday = data.emails_today ?? 0
  inbox.dailyLimit = data.daily_limit ?? 0
}

async function loadInboxEmail() {
  if (!isProOrTeam.value) return
  inbox.loading = true
  try {
    const data = await getInboxEmail()
    applyInbox(data)
  } catch (err) {
    if (err.status === 404) {
      inbox.address = null   // no address yet → empty state
    } else {
      toaster.push(err.message || 'Failed to load inbox email address')
    }
  } finally {
    inbox.loading = false
    inbox.loaded = true
  }
}

async function onGenerateAddress() {
  if (inbox.acting) return
  inbox.acting = true
  try {
    const data = await generateInboxEmail()
    inbox.address = data.email || null
    await loadInboxEmail()   // refresh usage / cap / enabled from GET
  } catch (err) {
    toaster.push(err.message || 'Failed to generate address')
  } finally {
    inbox.acting = false
  }
}

async function copyAddress(key, text) {
  const ok = await copyText(text)
  if (!ok) {
    toaster.push('Could not copy to clipboard')
    return
  }
  copied.value = key
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => { copied.value = null }, 2000)
}

async function onCopyAddress() {
  if (!inbox.address) return
  await copyAddress('inbox', inbox.address)
}

async function onResetAddress() {
  if (inbox.acting) return
  const confirmed = await confirm.show({
    title: 'Reset address',
    message: 'Reset inbox address? Your current address stops working immediately and you will need to update any forwarding rules.',
    confirmText: 'Reset address',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  inbox.acting = true
  try {
    const data = await regenerateInboxEmail()
    inbox.address = data.email || null
    await loadInboxEmail()   // refresh usage / cap / enabled
  } catch (err) {
    toaster.push(err.message || 'Failed to reset address')
  } finally {
    inbox.acting = false
  }
}

const captureEnabled = computed({
  get: () => inbox.enabled,
  set: (val) => onToggleCapture(val),
})

async function onToggleCapture(val) {
  if (inbox.savingCapture) return
  inbox.savingCapture = true
  try {
    const data = await setInboxEmailEnabled(val)
    inbox.enabled = data.enabled !== false
  } catch (err) {
    toaster.push(err.message || 'Failed to update capture')
    // leave inbox.enabled unchanged — the toggle reverts to the prior state
  } finally {
    inbox.savingCapture = false
  }
}

function onContactSupport() {
  window.location.href = 'mailto:support@whatsnextaction.com'
}

function onUpgradeEmail() {
  upgradeModel().show({
    message: 'Email to Inbox is available on Pro and Team plans. Upgrade to get a private address and forward anything straight into your inbox.',
  })
}

// Calendar Sync — Pro/Team only, behind the `calendar` flag; reactive on tier so a downgrade reverts to locked
const calendarSyncEnabled = computed(() => hasFlag('calendar'))

const gcal = reactive({
  connected: false,      // calendar feature granted
  reauth: false,         // 409 calendar_reauth_required
  missing: false,        // selected calendar removed in Google — sync paused
  offerCreate: false,    // post-connect WhatsNextAction calendar modal
  calendars: [],
  selected: 'primary',
  loading: false,
  loaded: false,
  acting: false,         // connect / disconnect in flight
  savingCalendar: false,
  syncing: false,
})

const calendarNeedsReconnect = computed(() => gcal.reauth)
const showWhatSyncs = ref(false)
const timezoneLabel = computed(() => (settings.state.timezone || 'UTC').replace(/_/g, ' '))

const CREATE_WNA_CALENDAR = 'create-wna-calendar'

const calendarOptions = computed(() => {
  const options = gcal.calendars.map(c => ({ value: c.id, label: c.summary }))
  if (!gcal.calendars.some(c => c.wna)) {
    options.push({ value: CREATE_WNA_CALENDAR, label: '+ Create WhatsNextAction calendar', testid: 'calendar-sync-picker-create' })
  }
  return options
})

// Set by the /google/calendar return; consumed once the calendar list is loaded
let offerCreateAfterLoad = false

const selectedCalendar = computed({
  get: () => gcal.selected,
  set: (val) => onSelectCalendar(val),
})

function applyGoogleStatus(data) {
  gcal.connected = (data.features || []).includes('calendar')
  if ((data.partial_features || []).includes('calendar')) gcal.reauth = true
}

function onCalendarSyncError(err, fallback) {
  if (err.status === 409 && err.message === 'calendar_missing') {
    gcal.missing = true
    toaster.push('Calendar was removed in Google. Re-create it or pick another calendar.')
  } else if (err.status === 409) {
    gcal.reauth = true
    toaster.push('Google Calendar needs to be reconnected.')
  } else {
    toaster.push(err.message || fallback)
  }
}

async function loadCalendarSync() {
  if (!isProOrTeam.value || !calendarSyncEnabled.value) return
  gcal.loading = true
  try {
    applyGoogleStatus(await getGoogleStatus())
    if (gcal.connected) {
      await loadCalendarList()
      if (offerCreateAfterLoad) {
        gcal.offerCreate = !gcal.calendars.some(c => c.wna && c.id === gcal.selected)
      }
    }
  } catch (err) {
    onCalendarSyncError(err, 'Failed to load Google Calendar status')
  } finally {
    offerCreateAfterLoad = false
    gcal.loading = false
    gcal.loaded = true
  }
}

async function loadCalendarList() {
  const data = await listGoogleCalendars()
  gcal.calendars = data.calendars || []
  gcal.selected = data.selected || 'primary'
  gcal.missing = !!data.calendar_missing
}

function applyCalendarConnectReturn() {
  if (route.query.calendar !== 'connected') return
  const query = {...route.query}
  delete query.calendar
  router.replace({query})
  offerCreateAfterLoad = true
}

async function onConnectCalendar() {
  if (gcal.acting) return
  gcal.acting = true
  try {
    await startGoogleConnect('calendar')   // redirects to Google
  } catch (err) {
    if (err.status !== 403) toaster.push(err.message || 'Failed to connect Google Calendar')
    gcal.acting = false
  }
}

async function onDisconnectCalendar() {
  if (gcal.acting) return
  const confirmed = await confirm.show({
    title: 'Disconnect Google Calendar',
    message: 'Stop syncing your scheduled actions with Google Calendar? The WhatsNextAction calendar and all events already in your Google Calendar stay there. You can reconnect at any time.',
    confirmText: 'Disconnect',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  gcal.acting = true
  try {
    applyGoogleStatus(await disconnectGoogle('calendar'))
    gcal.reauth = false
    gcal.missing = false
    gcal.calendars = []
    try { await auth.refreshToken() } catch { /* the JWT catches up on the next rotation */ }
    toaster.success('Google Calendar disconnected')
  } catch (err) {
    toaster.push(err.message || 'Failed to disconnect Google Calendar')
  } finally {
    gcal.acting = false
  }
}

async function onSelectCalendar(calendarId) {
  if (calendarId === CREATE_WNA_CALENDAR) return onCreateWnaCalendar()
  if (gcal.savingCalendar || calendarId === gcal.selected) return
  const previous = gcal.selected
  gcal.selected = calendarId
  gcal.savingCalendar = true
  try {
    const data = await selectGoogleCalendar(calendarId)
    gcal.selected = data.selected || calendarId
    gcal.missing = false
  } catch (err) {
    gcal.selected = previous
    onCalendarSyncError(err, 'Failed to change calendar')
  } finally {
    gcal.savingCalendar = false
  }
}

async function onCreateWnaCalendar() {
  if (gcal.savingCalendar) return
  gcal.savingCalendar = true
  try {
    const data = await createWnaCalendar()
    gcal.selected = data.selected
    gcal.missing = false
    toaster.success('WhatsNextAction calendar created')
    await loadCalendarList()
  } catch (err) {
    if (err.status !== 403) onCalendarSyncError(err, 'Failed to create the WhatsNextAction calendar')
  } finally {
    gcal.savingCalendar = false
  }
}

function onAcceptWnaCalendar() {
  gcal.offerCreate = false
  onCreateWnaCalendar()
}

function onDeclineWnaCalendar() {
  gcal.offerCreate = false
}

async function onSyncCalendarNow() {
  if (gcal.syncing) return
  gcal.syncing = true
  try {
    const data = await syncCalendarNow()
    toaster.success(`Sync complete: ${data.exported ?? 0} sent to Google, ${data.imported ?? 0} updated from Google`)
  } catch (err) {
    onCalendarSyncError(err, 'Calendar sync failed')
  } finally {
    gcal.syncing = false
  }
}

// Google Drive storage — all tiers, behind the `drive` flag
const driveEnabled = computed(() => hasFlag('drive'))

const drive = reactive({
  connected: false,
  email: null,
  destination: 'local',
  loading: false,
  loaded: false,
  acting: false,
  savingDestination: false,
})

const destinationOptions = [
  { value: 'local', label: 'Local', testid: 'drive-destination-local' },
  { value: 'gdrive', label: 'Google Drive', testid: 'drive-destination-gdrive' },
]

const attachmentsDestination = computed({
  get: () => drive.connected ? drive.destination : 'local',
  set: (val) => onSelectDestination(val),
})

function applyDriveStatus(data) {
  drive.connected = (data.features || []).includes('drive')
  drive.email = data.email || null
}

async function loadDriveStorage() {
  if (!driveEnabled.value) return
  drive.loading = true
  try {
    const [status, storage] = await Promise.all([getGoogleStatus(), getStorageSettings()])
    applyDriveStatus(status)
    drive.destination = storage.attachments_destination || 'local'
  } catch (err) {
    toaster.push(err.message || 'Failed to load Google Drive status')
  } finally {
    drive.loading = false
    drive.loaded = true
  }
}

async function onConnectDrive() {
  if (drive.acting) return
  drive.acting = true
  try {
    await startGoogleConnect('drive')   // redirects to Google
  } catch (err) {
    if (err.status !== 403) toaster.push(err.message || 'Failed to connect Google Drive')
    drive.acting = false
  }
}

async function onDisconnectDrive() {
  if (drive.acting) return
  const confirmed = await confirm.show({
    title: 'Disconnect Google Drive',
    message: 'Files already in your Google Drive stay there, but they can\'t be opened in WhatsNextAction until you reconnect. New files will be saved locally.',
    confirmText: 'Disconnect',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  drive.acting = true
  try {
    applyDriveStatus(await disconnectGoogle('drive'))
    const storage = await getStorageSettings()
    drive.destination = storage.attachments_destination || 'local'
    try { await auth.refreshToken() } catch { /* the JWT catches up on the next rotation */ }
    toaster.success('Google Drive disconnected')
  } catch (err) {
    toaster.push(err.message || 'Failed to disconnect Google Drive')
  } finally {
    drive.acting = false
  }
}

async function onSelectDestination(value) {
  if (drive.savingDestination || value === drive.destination) return
  const previous = drive.destination
  drive.destination = value
  drive.savingDestination = true
  try {
    const data = await updateStorageSettings(value)
    drive.destination = data.attachments_destination || value
  } catch (err) {
    drive.destination = previous
    toaster.push(err.message || 'Failed to save setting')
  } finally {
    drive.savingDestination = false
  }
}

// Status badge beside the section title
const sectionStatus = computed(() => {
  switch (activeKey.value) {
    case 'emailInbox':
      if (!isProOrTeam.value) return { type: 'primary', label: 'Pro' }
      if (!inbox.address) return null
      return inbox.enabled ? { type: 'active', label: 'On' } : { type: 'pending', label: 'Paused' }
    case 'calendarSync':
      if (!isProOrTeam.value) return { type: 'primary', label: 'Pro' }
      if (gcal.loading && !gcal.loaded) return null
      if (gcal.reauth) return { type: 'failed', label: 'Reconnect needed' }
      if (!gcal.connected) return { type: 'draft', label: 'Not connected' }
      return gcal.missing ? { type: 'failed', label: 'Calendar removed' } : { type: 'active', label: 'Connected' }
    case 'storage':
      if (drive.loading && !drive.loaded) return null
      return drive.connected ? { type: 'active', label: 'Connected' } : { type: 'draft', label: 'Not connected' }
    default:
      return null
  }
})

function onUpgradeCalendarSync() {
  upgradeModel().show({
    message: 'Google Calendar sync is available on Pro and Team plans. Upgrade to see your scheduled actions in Google Calendar and keep reschedules in sync both ways.',
  })
}

// App version from Vite define
const appVersion = __APP_VERSION__

// Preferences - computed from settings model
const themeMode = computed({
  get: () => theme.mode.value,
  set: (val) => theme.setMode(val)
})

const themeModeOptions = [
  { value: 'system', label: 'System', testid: 'settings-theme-system' },
  { value: 'light', label: 'Light', testid: 'settings-theme-light' },
  { value: 'dark', label: 'Dark', testid: 'settings-theme-dark' }
]

const addPosition = computed({
  get: () => settings.state.newItemsPosition,
  set: (val) => settings.setNewItemsPosition(val).catch(() => toaster.push('Failed to save setting'))
})

const timezone = computed({
  get: () => settings.state.timezone,
  set: (val) => settings.setTimezone(val).catch(() => toaster.push('Failed to save setting'))
})

// Full IANA zone list when the browser supports it; always include UTC and the current value so the Select can label it
const timezoneOptions = computed(() => {
  let zones
  try {
    zones = Intl.supportedValuesOf('timeZone')
  } catch {
    zones = ['UTC']
  }
  if (!zones.includes('UTC')) zones = ['UTC', ...zones]
  const current = settings.state.timezone
  if (current && !zones.includes(current)) zones = [current, ...zones]
  return zones.map(z => ({ value: z, label: z.replace(/_/g, ' ') }))
})

const editingTagPresets = ref(false)
const editTagPresets = ref([])
const tagPresetsInput = ref(null)
const savingTagPresets = ref(false)
const defaultPresets = DEFAULT_PRESETS

function startTagPresetsEdit() {
  editTagPresets.value = [...settings.state.tagPresets]
  editingTagPresets.value = true
  nextTick(() => {
    tagPresetsInput.value?.focus()
  })
}

function cancelTagPresetsEdit() {
  editingTagPresets.value = false
}

async function saveTagPresets() {
  if (savingTagPresets.value) return

  const newValue = [...editTagPresets.value]
  if (JSON.stringify(newValue) === JSON.stringify(settings.state.tagPresets)) {
    editingTagPresets.value = false
    return
  }

  savingTagPresets.value = true
  try {
    await settings.setTagPresets(newValue)
    editingTagPresets.value = false
  } catch {
    toaster.push('Failed to save setting')
  } finally {
    savingTagPresets.value = false
  }
}


const reviewEnabled = computed({
  get: () => settings.state.reviewEnabled,
  set: (val) => settings.setReviewEnabled(val).catch(() => toaster.push('Failed to save setting'))
})

const horizonsEnabled = computed({
  get: () => settings.state.horizonsEnabled,
  set: (val) => settings.setHorizonsEnabled(val).catch(() => toaster.push('Failed to save setting'))
})

// Free / Pro see the events every tier receives; Team also the delegation, shared-project and connection replies
const notificationGroups = computed(() => NOTIFICATION_GROUPS
    .map(group => ({ ...group, events: group.events.filter(row => !row.team || tier.value === 'team') }))
    .filter(group => group.events.length))

const DEVICE_HINTS = {
  blocked: 'Notifications are blocked in this browser. Allow them for this site in your browser settings, then turn this on.',
  'ios-tab': 'On iPhone and iPad, add WhatsNextAction to your Home Screen (Share → Add to Home Screen), then turn this on there.',
  unsupported: 'This browser can\'t show notifications. Use a current Chrome, Edge, Firefox or Safari.',
}
const deviceHint = computed(() => DEVICE_HINTS[notifications.state.device] || 'Show notifications in this browser, even when WhatsNextAction is closed.')

const NOTIFICATION_SAVE_ERROR = 'Couldn\'t save that change. Check your connection and try again.'

function onEmailEnabledToggle(e) {
  notifications.setEmailEnabled(e.target.checked).catch(() => toaster.push(NOTIFICATION_SAVE_ERROR))
}

function onEventToggle(channel, event, e) {
  notifications.setEvent(channel, event, e.target.checked).catch(() => toaster.push(NOTIFICATION_SAVE_ERROR))
}

// Using the row answers the offer banner for this sign-in; the input is re-synced because a closed prompt leaves the state unchanged
async function onDeviceToggle(e) {
  const input = e.target
  notifications.markAnswered()
  if (input.checked) {
    try {
      if (await notifications.enableDevice() === 'on') toaster.success('Notifications are on for this device.')
    } catch {
      toaster.push('Couldn\'t turn on notifications for this device. Check your connection and try again.')
    }
  } else {
    try {
      await notifications.disableDevice()
    } catch {
      toaster.push('Couldn\'t turn off notifications for this device. Check your connection and try again.')
    }
  }
  input.checked = notifications.state.device === 'on'
}

const positionOptions = [
  { value: 'beginning', label: 'Top', testid: 'settings-position-beginning' },
  { value: 'end', label: 'Bottom', testid: 'settings-position-end' }
]

// Calendar preferences - computed from settings model
const weekStart = computed({
  get: () => settings.state.weekStart,
  set: (val) => settings.setWeekStart(val).catch(() => toaster.push('Failed to save setting'))
})

const weekStartOptions = [
  { value: 'mon', label: 'Monday', testid: 'settings-weekstart-mon' },
  { value: 'sun', label: 'Sunday', testid: 'settings-weekstart-sun' },
]

const timeFormat = computed({
  get: () => settings.state.timeFormat === '12-hour' ? '12h' : '24h',
  set: (val) => settings.setTimeFormat(val === '12h' ? '12-hour' : '24-hour').catch(() => toaster.push('Failed to save setting'))
})

const businessHoursStart = computed({
  get: () => settings.state.businessHoursStart,
  set: (val) => settings.setBusinessHoursStart(val).catch(() => toaster.push('Failed to save setting'))
})

const businessHoursEnd = computed({
  get: () => settings.state.businessHoursEnd,
  set: (val) => settings.setBusinessHoursEnd(val).catch(() => toaster.push('Failed to save setting'))
})

const businessDays = computed({
  get: () => settings.state.businessDays,
  set: (val) => settings.setBusinessDays(val).catch(() => toaster.push('Failed to save setting'))
})

const timeFormatOptions = [
  { value: '24h', label: '24-hour', testid: 'settings-timeformat-24h' },
  { value: '12h', label: '12-hour', testid: 'settings-timeformat-12h' }
]

const hourOptions = computed(() => Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: timeFormat.value === '24h'
      ? `${String(i).padStart(2, '0')}:00`
      : i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`
})))

const dayOptions = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' }
]

// Password modal state
const showPasswordModal = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const currentPasswordError = ref('')
const newPasswordError = ref('')
const confirmPasswordError = ref('')
const changingPassword = ref(false)
const currentPasswordInput = ref(null)

// Sessions state
const sessions = ref([])
const loadingSessions = ref(false)
const sessionsError = ref(null)
const revokingId = ref(null)
const revokingAll = ref(false)

// AI Apps state
const aiApps = ref([])
const loadingAiApps = ref(false)
const aiAppsError = ref(false)
const removingAiAppId = ref(null)
const mcpUrl = getDomains().mcp_url

// Other state
const isMobile = ref(false)
const loggingOut = ref(false)
const showDeleteModal = ref(false)
const deleteEmail = ref('')
const deleteEmailInput = ref(null)
const deletingAccount = ref(false)
const deleteEmailMatches = computed(() =>
    !!userEmail.value && deleteEmail.value.trim().toLowerCase() === userEmail.value.toLowerCase())

// Computed
const canChangePassword = computed(() => {
  return currentPassword.value.trim() &&
      newPassword.value.trim() &&
      confirmPassword.value.trim() &&
      !changingPassword.value
})

// Lifecycle
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  compactQuery.addEventListener('change', onCompactChange)
  loadStats() // deep-linked /settings may mount before the sidebar populates stats
  loadSessions()
  loadAiApps()
  settings.load().catch(() => {
    // Settings will fall back to localStorage, no need to show error
  })
  notifications.load().catch(() => {
    // Notification settings will fall back to defaults
  })
  notifications.refreshDevice()

  loadInboxEmail()
  applyCalendarConnectReturn()
  loadCalendarSync()
  loadDriveStorage()
  loadPaymentStatus()
  loadAssistant()

  applyCheckoutReturn()
})

watch(paymentsEnabled, (on) => {
  if (on && !payment.state.loaded) loadPaymentStatus()
})

// Re-fetch (or clear) the inbox address when the tier changes — keeps the card reactive to upgrade/downgrade; Free reverts to the locked block
watch(tier, (t) => {
  if (t === 'pro' || t === 'team') {
    if (!inbox.loaded) loadInboxEmail()
  } else {
    inbox.address = null
    inbox.loaded = false
  }
})

// Flags load asynchronously and the tier can change — load on entitlement, reset on downgrade
watch([isProOrTeam, calendarSyncEnabled], ([entitled, enabled]) => {
  if (entitled && enabled) {
    if (!gcal.loaded) loadCalendarSync()
  } else {
    gcal.loaded = false
    gcal.reauth = false
    gcal.missing = false
    gcal.offerCreate = false
    gcal.calendars = []
  }
})

watch(driveEnabled, (enabled) => {
  if (enabled && !drive.loaded) loadDriveStorage()
})

watch(activeKey, () => {
  nextTick(() => { if (paneScroll.value) paneScroll.value.scrollTop = 0 })
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  compactQuery.removeEventListener('change', onCompactChange)
  if (copiedTimer) clearTimeout(copiedTimer)
  clearTimeout(areaScrollTimer)
})

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

// Sessions functions
async function loadSessions() {
  loadingSessions.value = true
  sessionsError.value = null
  try {
    const data = await listSessions()
    sessions.value = Array.isArray(data) ? data : (data.sessions || [])
  } catch (err) {
    sessionsError.value = err.message || 'Failed to load sessions'
  } finally {
    loadingSessions.value = false
  }
}

const LOGIN_METHOD_LABELS = {
  email: 'Signed in with email',
  google: 'Signed in with Google',
  apple: 'Signed in with Apple',
}

function sessionSegments(session) {
  return [
    LOGIN_METHOD_LABELS[session.login_method],
    session.ip,
    session.last_active && formatSessionTime(session.last_active),
  ].filter(Boolean)
}

function formatSessionTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

async function onRevokeSession(sessionId) {
  const session = sessions.value.find(s => s.id === sessionId)
  const isCurrent = session?.is_current

  const confirmed = isCurrent
      ? await auth.confirmLogout()
      : await confirm.show({
        title: 'End Session',
        message: 'Are you sure you want to end this session? The device will be signed out within the next hour.',
        confirmText: 'End Session',
        cancelText: 'Cancel'
      })

  if (!confirmed) return

  revokingId.value = sessionId
  try {
    await revokeSession(sessionId)
    if (isCurrent) {
      await auth.logoutUser()
      router.push({ name: 'login' })
    } else {
      sessions.value = sessions.value.filter(s => s.id !== sessionId)
      toaster.success('Session ended')
    }
  } catch (err) {
    toaster.push(err.message || 'Failed to end session')
  } finally {
    revokingId.value = null
  }
}

async function onRevokeAllSessions() {
  const otherCount = sessions.value.filter(s => !s.is_current).length
  const confirmed = await confirm.show({
    title: 'End All Other Sessions',
    message: `Are you sure you want to end all other sessions? ${otherCount} device${otherCount !== 1 ? 's' : ''} will be signed out within the next hour.`,
    confirmText: 'End All',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  revokingAll.value = true
  try {
    await revokeAllSessions()
    sessions.value = sessions.value.filter(s => s.is_current)
    toaster.success('All other sessions ended')
  } catch (err) {
    toaster.push(err.message || 'Failed to end sessions')
  } finally {
    revokingAll.value = false
  }
}

// AI Apps functions
async function loadAiApps() {
  loadingAiApps.value = true
  aiAppsError.value = false
  try {
    const data = await listAiApps()
    aiApps.value = data.ai_apps || []
  } catch {
    aiAppsError.value = true
  } finally {
    loadingAiApps.value = false
  }
}

function formatConnectedDate(dateStr) {
  return new Date(dateStr).toLocaleDateString()
}

async function onRemoveAiApp(app) {
  const confirmed = await confirm.show({
    title: 'Remove AI App',
    message: `${app.name} will lose access to your WhatsNextAction data within a few minutes. To use it again, connect it again from ${app.name}.`,
    confirmText: 'Remove',
    cancelText: 'Cancel'
  })
  if (!confirmed) return

  removingAiAppId.value = app.id
  try {
    await removeAiApp(app.id)
  } catch (err) {
    if (err.status !== 404) {
      toaster.push(`Couldn't remove ${app.name}. Try again.`)
      return
    }
  } finally {
    removingAiAppId.value = null
  }
  aiApps.value = aiApps.value.filter(a => a.id !== app.id)
  toaster.success(`${app.name} removed`)
}

// Password modal functions
function openPasswordModal() {
  showPasswordModal.value = true
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  currentPasswordError.value = ''
  newPasswordError.value = ''
  confirmPasswordError.value = ''
  nextTick(() => {
    currentPasswordInput.value?.focus()
  })
}

function closePasswordModal() {
  showPasswordModal.value = false
}

async function onChangePassword() {
  currentPasswordError.value = ''
  newPasswordError.value = ''
  confirmPasswordError.value = ''

  // Validate
  if (!currentPassword.value.trim()) {
    currentPasswordError.value = 'Current password is required'
  }

  if (!isValidPassword(newPassword.value)) {
    newPasswordError.value = 'Password must contain letters, numbers and symbols'
  }

  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match'
  }

  if (currentPasswordError.value || newPasswordError.value || confirmPasswordError.value) {
    return
  }

  changingPassword.value = true
  try {
    const result = await changePassword(currentPassword.value, newPassword.value)
    const revokedCount = result?.revoked_sessions || 0
    if (revokedCount > 0) {
      toaster.success(`Password changed. ${revokedCount} other session${revokedCount !== 1 ? 's' : ''} signed out.`)
    } else {
      toaster.success('Password changed successfully')
    }
    closePasswordModal()
    loadSessions()
    loadAiApps()
  } catch (err) {
    toaster.push('Password change failed: ' + mapApiError(err, ErrorScenario.CHANGE_PASSWORD))
  } finally {
    changingPassword.value = false
  }
}

// Account actions
function openDeleteModal() {
  deleteEmail.value = ''
  showDeleteModal.value = true
  nextTick(() => deleteEmailInput.value?.focus())
}

function closeDeleteModal() {
  if (deletingAccount.value) return
  showDeleteModal.value = false
}

async function onDeleteAccount() {
  if (!deleteEmailMatches.value || deletingAccount.value) return
  deletingAccount.value = true
  try {
    await auth.deleteAccount()
    showDeleteModal.value = false
    toaster.success('Your account has been deleted.')
    router.push({ name: 'landing' })
  } catch (err) {
    // 401: the session interceptor already refreshed or sent the user to login
    if (err.status !== 401) toaster.push('Couldn\'t delete your account. Please try again.')
  } finally {
    deletingAccount.value = false
  }
}

async function onLogout() {
  if (!await auth.confirmLogout()) return

  loggingOut.value = true
  await auth.logoutUser()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.settings-header {
  flex-shrink: 0;
  padding: 0 16px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 38px;
}

.settings-header h1 {
  margin: 0;
}

.settings-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-search-wrap {
  width: 180px;
}

.settings-search-wrap :deep(label) {
  width: auto;
}

.settings-search-wrap :deep(input) {
  margin-top: 0;
  margin-bottom: 0;
  padding: 6px 10px;
}

.settings-search-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  color: var(--color-text-tertiary);
  transition: color 0.15s, background 0.15s;
  display: flex;
  align-items: center;
}

.settings-search-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.settings-search-btn--active {
  color: var(--color-action);
}

.settings-search-btn svg {
  width: 18px;
  height: 18px;
}

/* Back link of a section screen — the detail-page back look */
.settings-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-link-text);
}

.settings-back-arrow {
  padding: 4px 8px;
  border-radius: 4px;
}

.settings-back:hover {
  color: var(--color-link-hover);
}

.settings-back:hover .settings-back-arrow {
  background: var(--color-bg-secondary);
}

/* Menu beside the pane; each scrolls on its own */
.settings-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 32px;
}

.settings-scroll {
  overflow-y: auto;
  min-height: 0;
  touch-action: pan-y;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.settings-scroll.scrolling {
  scrollbar-color: var(--color-border-light) transparent;
}

.settings-scroll::-webkit-scrollbar {
  width: 4px;
}

.settings-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.settings-scroll::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
}

.settings-scroll.scrolling::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
}

.settings-nav {
  flex: 0 0 220px;
  padding-bottom: 20px;
}

.settings-nav-group + .settings-nav-group {
  margin-top: 20px;
}

.settings-group-title {
  display: block;
  padding: 0 16px 6px;
  color: var(--color-text-secondary);
}

.settings-nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  border-radius: 8px;
  text-align: left;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.settings-nav-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.settings-nav-item--active,
.settings-nav-item--active:hover {
  background: var(--color-action-subtle);
  color: var(--color-action);
  font-weight: var(--font-weight-semibold);
}

.settings-nav-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-nav .settings-empty {
  padding: 12px 16px;
}

.settings-pane-scroll {
  flex: 1;
  min-width: 0;
  padding-bottom: 20px;
}

.settings-pane {
  max-width: var(--section-max-width);
}

.settings-pane-head {
  margin-bottom: 16px;
}

.settings-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-section-title {
  margin: 0;
  color: var(--color-text-primary);
}

.settings-section-description {
  margin: 4px 0 0;
}

.settings-section-body {
  padding: 0 20px;
}

.settings-version {
  margin: 12px 0 0;
  padding: 0 20px;
}

/* ≤ 1024px: index screen (Weekly Review step-row look) and one screen per section */
.settings-page--compact .settings-layout {
  flex-direction: column;
}

.settings-page--compact .settings-nav,
.settings-page--compact .settings-pane-scroll {
  flex: 1;
}

.settings-page--compact .settings-nav-list {
  gap: 0;
  margin-bottom: 0;
}

.settings-page--compact .settings-nav-item {
  padding: 16px 20px;
  border-radius: 0;
  border-top: 1px solid var(--color-border-subtle);
  color: inherit;
}

.settings-page--compact .settings-nav-item:first-child {
  border-top: none;
}

.settings-page--compact .settings-nav-item:hover {
  background: var(--color-bg-row-hover);
}

.settings-nav-title {
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary-dark);
}

.settings-nav-chevron {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
}

.settings-page--compact .settings-group-title {
  padding: 0 4px 8px;
}

.settings-page--compact .settings-pane-head {
  padding: 0 4px;
}

.settings-page--compact .settings-section-title {
  color: var(--color-action-dark);
}

/* Rows */
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.settings-row > .base-btn {
  flex-shrink: 0;
}

.settings-row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-label {
  font-size: 14px;
  color: var(--color-text-primary);
}

.settings-value {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.settings-email {
  min-width: 0;
  text-align: right;
  overflow-wrap: anywhere;
}

.settings-hours {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-control {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.settings-control--saving {
  pointer-events: none;
}

.settings-control--saving > *:not(.settings-saving-spinner) {
  opacity: 0.5;
}

/* Long model names ellipsize; the height matches the other Settings selects */
.assistant-model {
  width: 260px;
}

.assistant-model :deep(.select-trigger) {
  padding: 6px 12px;
}

.settings-row--column .assistant-model {
  width: 100%;
}

.assistant-model :deep(.select-wrapper) {
  flex: 1;
  min-width: 0;
}

.delete-account-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.delete-account-body p {
  margin: 0;
}

.delete-account-email {
  overflow-wrap: anywhere;
}

.settings-hint {
  color: var(--color-text-tertiary);
  line-height: var(--lh-normal);
}

.settings-tags-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.settings-tag-chip {
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

.settings-tag-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}


.settings-days-control {
  position: relative;
  display: inline-block;
}

.settings-info-note {
  margin: 8px 0 16px;
}

/* Notifications: one row per event, an Email and a Web toggle column; rows 1–2 keep their toggle under Web */
.notif-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  margin-top: 12px;
}

.notif-group-name {
  color: var(--color-text-secondary);
}

.notif-columns {
  display: flex;
  gap: 24px;
  flex-shrink: 0;
}

.notif-column-label {
  width: 44px;
  text-align: center;
  color: var(--color-text-tertiary);
}

.notif-row-text {
  min-width: 0;
  padding-right: 16px;
}

/* Email to Inbox, AI Apps: the address to copy */
.email-address-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  width: 100%;
}

.email-address {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--color-bg-secondary);
  font-family: var(--font-family-mono);
  word-break: break-all;
}

.settings-saving-spinner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.settings-saving-spin {
  --spinner-track: var(--color-action-ring);
}

/* Loading, error, empty states */
.settings-loading,
.settings-error,
.settings-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  color: var(--color-text-secondary);
}

.settings-error {
  color: var(--color-danger);
}


/* Sessions list */
.sessions-list {
  display: flex;
  flex-direction: column;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.session-item:last-child {
  border-bottom: none;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.session-device {
  display: flex;
  align-items: center;
  gap: 8px;
}

.session-name {
  color: var(--color-text-primary);
}

.session-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 6px;
  color: var(--color-text-tertiary);
}

.session-segment {
  white-space: nowrap;
}

.session-separator {
  color: var(--color-text-tertiary);
}

/* Toggle switch */
.settings-toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.settings-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.settings-toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 24px;
  transition: 0.2s;
}

.settings-toggle-slider::before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.settings-toggle input:disabled + .settings-toggle-slider {
  opacity: 0.4;
  pointer-events: none;
}

.settings-toggle input:checked + .settings-toggle-slider {
  background-color: var(--color-action);
  border-color: var(--color-action);
}

.settings-toggle input:checked + .settings-toggle-slider::before {
  transform: translateX(20px);
}

/* Business days */
.settings-row--column {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.settings-days {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.settings-day-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.15s;
}

.settings-day-checkbox:hover {
  border-color: var(--color-action);
}

.settings-day-checkbox:has(input:checked) {
  background: var(--color-action);
  border-color: var(--color-action);
  color: var(--color-text-inverse);
}

.settings-day-checkbox input {
  display: none;
}


/* Password Modal */
.password-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay-light);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.password-modal-overlay--fullscreen {
  padding: 0;
  background: var(--color-bg-primary);
}

.password-modal {
  background: var(--color-bg-primary);
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-elevated);
  display: flex;
  flex-direction: column;
}

.password-modal--fullscreen {
  max-width: none;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
}

.password-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-light);
}

.password-modal-title {
  color: var(--color-text-primary);
  margin: 0;
}

.password-modal-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px 8px;
  line-height: var(--lh-none);
}

.password-modal-close:hover {
  color: var(--color-text-primary);
}

.password-modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.password-modal-hint {
  margin: 0;
}

.password-modal--fullscreen .password-modal-body {
  flex: 1;
}

.password-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border-light);
}

/* Responsive */
@media (max-width: 768px) {
  .settings-header {
    padding: 0 12px;
  }

  .settings-pane-scroll,
  .settings-nav {
    padding: 0 12px 12px;
  }

  .settings-row {
    padding: 12px 0;
  }

  .settings-row--column .settings-control {
    width: 100%;
  }

  .settings-row--column .settings-control :deep(.select-wrapper) {
    flex: 1;
    min-width: 0;
  }

  .settings-row--column .settings-control :deep(.select-trigger) {
    width: 100%;
  }

  .settings-row--column .settings-control :deep(.segment-switch) {
    flex: 1;
    min-width: 0;
  }

  .settings-row--column .settings-control :deep(.segment-switch__option) {
    flex: 1;
  }

  .session-name {
    word-break: break-word;
  }
}
</style>
