<template>
    <div class="settings-page">

      <!-- Header -->
      <div class="settings-header">
        <h1 class="page-title">Settings</h1>
        <div class="settings-header-right">
          <div v-if="searchVisible" class="settings-search-wrap">
            <Inpt
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Search settings..."
                @input="onSearchInput"
            />
          </div>
          <button type="button" class="settings-search-btn" :class="{ 'settings-search-btn--active': searchVisible }" @click="toggleSearch" aria-label="Search settings">
            <SearchIcon />
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="settings-body">

        <!-- Account Section -->
        <div v-if="sectionVisible('account')" class="card">
          <div class="card-header card-header--toggle" @click="toggleSection('account')">
            <h2 class="settings-section-title">Account</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('account') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('account')" class="settings-section-body">
            <div class="settings-row">
              <span class="settings-label">Email</span>
              <span class="settings-value">{{ userEmail }}</span>
            </div>
            <div class="settings-row">
              <span class="settings-label">Password</span>
              <Btn variant="secondary" size="sm" @click="openPasswordModal">Change Password</Btn>
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

        <!-- Plan Section -->
        <div v-if="tier && sectionVisible('plan')" class="card">
          <div class="card-header card-header--toggle" @click="toggleSection('plan')">
            <h2 class="settings-section-title">Plan</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('plan') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('plan') && confirmingPayment" class="settings-section-body">
            <div class="settings-loading">
              <Spinner :size="16" />
              <span>Confirming your payment...</span>
            </div>
          </div>
          <div v-else-if="isExpanded('plan')" class="settings-section-body">
            <div v-if="paymentStillProcessing && tier === 'free'" class="settings-row">
              <p class="text-body-s settings-hint">Your payment is still being processed — your plan will update once it's confirmed. Card payments confirm within minutes; bank debits (SEPA) can take up to 6 business days.</p>
            </div>
            <div class="settings-row">
              <span class="settings-label">Current plan</span>
              <span class="settings-value fw-semibold" :class="tier === 'team' ? 'color-text-success' : ''">{{ tierLabel }}</span>
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

            <!-- Payment & billing -->
            <template v-if="paymentsEnabled">
              <div v-if="payment.state.loading && !payment.state.loaded" class="settings-loading">
                <Spinner :size="16" />
                <span>Loading subscription...</span>
              </div>

              <template v-else-if="payment.state.loaded">
                <!-- Active subscriber -->
                <template v-if="hasActiveSubscription">
                  <div class="settings-row">
                    <span class="settings-label">{{ payment.state.cancelAtPeriodEnd ? 'Access until' : 'Renews on' }}</span>
                    <span class="settings-value">{{ formatBillingDate(payment.state.expiresAt) }}</span>
                  </div>

                  <!-- No change-plan UI: switch plans by cancelling, then upgrading after expiry -->
                  <div v-if="!payment.state.cancelAtPeriodEnd" class="settings-row">
                    <div>
                      <span class="settings-label">Cancel subscription</span>
                      <p class="text-body-s settings-hint">Stops auto-renew — you keep access until the expiration date</p>
                    </div>
                    <Btn variant="ghost-danger" size="sm" :disabled="payment.state.acting" @click="onCancelSubscription">Cancel</Btn>
                  </div>
                </template>

                <!-- Free / lapsed — upgrade. A paid tier granted without a subscription (admin) gets no upgrade or cancel -->
                <div v-else-if="tier === 'free'" class="settings-row">
                  <div>
                    <span class="settings-label">Update plan</span>
                    <p class="text-body-s settings-hint">Unlock Pro or Team features</p>
                  </div>
                  <Btn variant="primary" size="sm" @click="router.push({ name: 'upgrade' })">Upgrade</Btn>
                </div>

                <div class="settings-row">
                  <span class="settings-label">Billing history</span>
                  <Btn variant="secondary" size="sm" @click="router.push({ name: 'billing-history' })">View</Btn>
                </div>
              </template>
            </template>
            <div v-else class="settings-row">
              <span class="settings-label">Update plan</span>
              <Btn variant="primary" size="sm" @click="onContactSupport">Contact Us</Btn>
            </div>
          </div>
        </div>

        <!-- AI Assistant Section -->
        <div v-if="assistant.enabled.value && sectionVisible('assistant')" class="card" data-testid="settings-assistant">
          <div class="card-header card-header--toggle" @click="toggleSection('assistant')">
            <h2 class="settings-section-title">AI Assistant</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('assistant') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('assistant')" class="settings-section-body">
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
                <Btn v-if="paymentsEnabled" variant="primary" size="sm" class="assistant-buy-btn" @click="router.push({ name: 'buy-credits' })">Buy</Btn>
                <Btn v-else variant="primary" size="sm" class="assistant-buy-btn" @click="onContactSupport">Contact Us</Btn>
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

        <AssistantMemoryModal :visible="showMemoryModal" @close="showMemoryModal = false" />

        <!-- Email to Inbox Section -->
        <div v-if="tier && sectionVisible('emailInbox')" class="card">
          <div class="card-header card-header--toggle" @click="toggleSection('emailInbox')">
            <h2 class="settings-section-title">Email to Inbox</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('emailInbox') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('emailInbox')" class="settings-section-body">

            <!-- Free: locked -->
            <div v-if="!isProOrTeam" class="settings-row settings-row--column">
              <span class="settings-value email-locked">🔒 Email to Inbox is available on Pro and Team plans.</span>
              <Btn variant="primary" size="sm" @click="paymentsEnabled ? onUpgradeEmail() : onContactSupport()">{{ paymentsEnabled ? 'Upgrade' : 'Contact Us' }}</Btn>
            </div>

            <!-- Pro/Team -->
            <template v-else>
              <!-- Loading -->
              <div v-if="inbox.loading && !inbox.loaded" class="settings-loading">
                <Spinner :size="16" />
                <span>Loading...</span>
              </div>

              <!-- Empty state: no address yet -->
              <div v-else-if="!inbox.address" class="settings-row settings-row--column">
                <span class="text-body-s settings-hint email-valueprop">Get a private email address. Forward anything to capture it instantly.</span>
                <Btn variant="primary" size="sm" :loading="inbox.acting" :disabled="inbox.acting" @click="onGenerateAddress">Generate Address</Btn>
              </div>

              <!-- Address present -->
              <template v-else>
                <div class="settings-row settings-row--column">
                  <span class="settings-label">Your inbox address</span>
                  <div class="email-address-row">
                    <span class="settings-value email-address">{{ inbox.address }}</span>
                    <Btn variant="secondary" size="sm" @click="onCopyAddress">{{ copied === 'inbox' ? 'Copied!' : 'Copy' }}</Btn>
                  </div>
                  <span class="text-body-s settings-hint">Forward any email to this address to capture it as a new item.</span>
                  <span class="text-body-s settings-hint">Attachments are saved with the item within your plan's limits.</span>
                </div>

                <div class="settings-row">
                  <span class="settings-label">Usage</span>
                  <span class="settings-value">Used today: {{ inbox.emailsToday }} of {{ inbox.dailyLimit }}</span>
                </div>

                <div class="settings-row">
                  <div>
                    <span class="settings-label">Capture</span>
                    <p class="text-body-s settings-hint">{{ inbox.enabled ? 'Capture is on' : 'Capture is paused' }}</p>
                  </div>
                  <div class="settings-control" :class="{ 'settings-control--saving': inbox.savingCapture }">
                    <span v-if="inbox.savingCapture" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                    <label class="settings-toggle">
                      <input type="checkbox" v-model="captureEnabled" />
                      <span class="settings-toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div class="settings-row">
                  <span class="settings-label">Reset address</span>
                  <Btn variant="ghost" size="sm" :loading="inbox.acting" :disabled="inbox.acting" @click="onResetAddress">Reset address</Btn>
                </div>
              </template>
            </template>
          </div>
        </div>

        <!-- Sessions Section -->
        <div v-if="sectionVisible('sessions')" class="card">
          <div class="card-header card-header--toggle" @click="toggleSection('sessions')">
            <h2 class="settings-section-title">Sessions</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('sessions') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('sessions')" class="settings-section-body">
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
              <div
                  v-for="session in sessions"
                  :key="session.id"
                  class="session-item"
                  :class="{ 'session-item--current': session.is_current }"
              >
                <div class="session-info">
                  <div class="session-device">
                    <span class="session-icon">{{ getDeviceIcon(session) }}</span>
                    <span class="fw-medium session-name">{{ session.device || 'Unknown Device' }}</span>
                    <span v-if="session.is_current" class="text-footnote fw-semibold session-badge">Current</span>
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

        <!-- AI Apps Section -->
        <div v-if="sectionVisible('aiApps')" class="card">
          <div class="card-header card-header--toggle" @click="toggleSection('aiApps')">
            <h2 class="settings-section-title">AI Apps</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('aiApps') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('aiApps')" class="settings-section-body">
            <div v-if="loadingAiApps" class="settings-loading">
              <Spinner :size="16" />
              <span>Loading AI apps...</span>
            </div>

            <template v-else>
              <div v-if="aiAppsError" class="settings-error">
                <span>Couldn't load your AI apps.</span>
                <Btn variant="secondary" size="sm" @click="loadAiApps">Retry</Btn>
              </div>

              <div v-else-if="aiApps.length === 0" class="settings-empty">
                No AI apps connected yet.
              </div>

              <div v-else class="sessions-list ai-apps-list">
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

              <div class="settings-row settings-row--column">
                <span class="settings-label">Connect an AI app</span>
                <div class="email-address-row">
                  <span class="settings-value email-address">{{ mcpUrl }}</span>
                  <Btn variant="secondary" size="sm" @click="copyAddress('mcp', mcpUrl)">{{ copied === 'mcp' ? 'Copied!' : 'Copy' }}</Btn>
                </div>
                <span class="text-body-s settings-hint">Add this address as a connector in Claude, ChatGPT or any AI app that supports MCP. You'll be asked to sign in and allow access.</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Application Section -->
        <div v-if="sectionVisible('application')" class="card">
          <div class="card-header card-header--toggle" @click="toggleSection('application')">
            <h2 class="settings-section-title">Application</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('application') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('application')" class="settings-section-body">
            <div class="settings-row">
              <span class="settings-label">Theme</span>
              <Select
                  v-model="themeMode"
                  :options="themeModeOptions"
                  title="Theme"
              />
            </div>
            <div class="settings-row">
              <span class="settings-label">New items position in the list</span>
              <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.newItemsPosition }">
                <span v-if="settings.state.saving.newItemsPosition" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                <Select
                    v-model="addPosition"
                    :options="positionOptions"
                    title="New items position"
                />
              </div>
            </div>
            <div class="settings-row">
              <div>
                <span class="settings-label">Timezone</span>
                <p class="text-body-s settings-hint">Used for day-scoped views and your daily digest email</p>
              </div>
              <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.timezone }">
                <span v-if="settings.state.saving.timezone" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                <Select
                    v-model="timezone"
                    :options="timezoneOptions"
                    title="Timezone"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Tags Section -->
        <div v-if="sectionVisible('tags')" class="card">
          <div class="card-header card-header--toggle" @click="toggleSection('tags')">
            <h2 class="settings-section-title">Tags</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('tags') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('tags')" class="settings-section-body">
            <div class="settings-row settings-row--column">
              <span class="settings-label">Quick-add presets</span>
              <span class="text-body-s settings-hint">These appear as clickable suggestions below the tag input. Leave empty to use defaults.</span>
              <div v-if="!editingTagPresets" class="settings-tags-display" @click="startTagPresetsEdit">
                <span v-if="settings.state.tagPresets.length > 0" class="settings-tags-chips">
                  <span v-for="tag in settings.state.tagPresets" :key="tag" class="text-body-s settings-tag-chip">{{ tag }}</span>
                </span>
                <span v-else class="settings-tag-placeholder">Add preset tags...</span>
              </div>
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
          </div>
        </div>

        <!-- Calendar Section -->
        <div v-if="sectionVisible('calendar')" class="card">
          <div class="card-header card-header--toggle" @click="toggleSection('calendar')">
            <h2 class="settings-section-title">Calendar</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('calendar') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('calendar')" class="settings-section-body">
          <div class="settings-row">
            <span class="settings-label">Week starts on</span>
            <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.weekStart }">
              <span v-if="settings.state.saving.weekStart" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
              <Select v-model="weekStart" :options="weekStartOptions" title="Week starts on" />
            </div>
          </div>

          <div class="settings-row">
            <span class="settings-label">Time format</span>
            <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.timeFormat }">
              <span v-if="settings.state.saving.timeFormat" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
              <Select
                  v-model="timeFormat"
                  :options="timeFormatOptions"
                  title="Time format"
              />
            </div>
          </div>

          <div class="settings-row">
            <span class="settings-label">Business hours start</span>
            <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.businessHoursStart }">
              <span v-if="settings.state.saving.businessHoursStart" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
              <Select
                  v-model="businessHoursStart"
                  :options="hourOptions"
                  title="Start hour"
              />
            </div>
          </div>

          <div class="settings-row">
            <span class="settings-label">Business hours end</span>
            <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.businessHoursEnd }">
              <span v-if="settings.state.saving.businessHoursEnd" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
              <Select
                  v-model="businessHoursEnd"
                  :options="hourOptions"
                  title="End hour"
              />
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

        <!-- Calendar Sync Section -->
        <div v-if="tier && calendarSyncEnabled && sectionVisible('calendarSync')" class="card" data-testid="calendar-sync-card">
          <div class="card-header card-header--toggle" @click="toggleSection('calendarSync')">
            <h2 class="settings-section-title">Calendar Sync</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('calendarSync') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('calendarSync')" class="settings-section-body">

            <!-- Free: locked -->
            <div v-if="!isProOrTeam" class="settings-row settings-row--column" data-testid="calendar-sync-lockout">
              <span class="settings-value email-locked">🔒 Google Calendar sync is available on Pro and Team plans.</span>
              <Btn variant="primary" size="sm" data-testid="calendar-sync-upgrade" @click="paymentsEnabled ? onUpgradeCalendarSync() : onContactSupport()">{{ paymentsEnabled ? 'Upgrade' : 'Contact Us' }}</Btn>
            </div>

            <!-- Pro/Team -->
            <template v-else>
              <div v-if="gcal.loading && !gcal.loaded" class="settings-loading">
                <Spinner :size="16" />
                <span>Loading...</span>
              </div>

              <!-- Not connected / reconnect needed -->
              <div v-else-if="!gcal.connected || gcal.reauth" class="settings-row settings-row--column">
                <span class="settings-value" data-testid="calendar-sync-status">{{ calendarNeedsReconnect ? 'Google Calendar needs to be reconnected' : 'Not connected' }}</span>
                <span class="text-body-s settings-hint email-valueprop">Show your scheduled actions in Google Calendar. Reschedules made on either side sync both ways.</span>
                <Btn variant="primary" size="sm" :loading="gcal.acting" :disabled="gcal.acting" data-testid="calendar-sync-connect" @click="onConnectCalendar">{{ calendarNeedsReconnect ? 'Reconnect Google Calendar' : 'Connect Google Calendar' }}</Btn>
              </div>

              <!-- Connected -->
              <template v-else>
                <div class="settings-row">
                  <span class="settings-label">Status</span>
                  <span class="settings-value" :class="{ 'color-text-success': !gcal.missing }" data-testid="calendar-sync-status">{{ gcal.missing ? 'Calendar was removed in Google' : 'Connected' }}</span>
                </div>

                <!-- Selected calendar removed in Google: sync paused -->
                <div v-if="gcal.missing" class="settings-row settings-row--column" data-testid="calendar-sync-missing">
                  <span class="text-body-s settings-hint email-valueprop">Sync is paused and your actions are unchanged. Re-create the WhatsNextAction calendar or pick another calendar.</span>
                  <Btn variant="primary" size="sm" :loading="gcal.savingCalendar" :disabled="gcal.savingCalendar" data-testid="calendar-sync-recreate" @click="onCreateWnaCalendar">Re-create calendar</Btn>
                </div>

                <div class="settings-row">
                  <span class="settings-label">Calendar</span>
                  <div class="settings-control" :class="{ 'settings-control--saving': gcal.savingCalendar }">
                    <span v-if="gcal.savingCalendar" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                    <Select v-model="selectedCalendar" :options="calendarOptions" title="Calendar" data-testid="calendar-sync-picker" />
                  </div>
                </div>

                <div class="settings-row">
                  <div>
                    <span class="settings-label">Timezone</span>
                    <p class="text-body-s settings-hint">Timed events in Google Calendar use this timezone</p>
                  </div>
                  <div class="settings-control" :class="{ 'settings-control--saving': settings.state.saving.timezone }">
                    <span v-if="settings.state.saving.timezone" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                    <Select v-model="timezone" :options="timezoneOptions" title="Timezone" data-testid="calendar-sync-timezone" />
                  </div>
                </div>

                <div class="settings-row settings-row--column" data-testid="calendar-sync-what-syncs">
                  <span class="settings-label">What syncs</span>
                  <span class="text-body-s settings-hint email-valueprop">Scheduled actions in Next, Today, Calendar and Waiting For: title, description, date and time. Changes made in Google to these events come back to WNA, and deleting one in Google moves its action to Trash. In the WhatsNextAction calendar, events you create in Google become scheduled actions, and each occurrence of a recurring event in the next 30 days becomes its own action. Due dates, start dates and your other Google events do not sync. Completing or trashing an action removes its event.</span>
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

        <Modal :visible="gcal.offerCreate" title="WhatsNextAction calendar" @close="onDeclineWnaCalendar">
          <div class="text-body-m color-text-secondary" data-testid="calendar-sync-create-modal">Create a WhatsNextAction calendar in your Google account and sync your scheduled actions there? Events you create in that calendar in Google become actions in WNA. You can change the calendar at any time.</div>
          <template #actions>
            <Btn variant="secondary" size="sm" data-testid="calendar-sync-create-no" @click="onDeclineWnaCalendar">No</Btn>
            <Btn variant="primary" size="sm" data-testid="calendar-sync-create-yes" @click="onAcceptWnaCalendar">Yes</Btn>
          </template>
        </Modal>

        <!-- Storage Section -->
        <div v-if="tier && driveEnabled && sectionVisible('storage')" class="card" data-testid="drive-card">
          <div class="card-header card-header--toggle" @click="toggleSection('storage')">
            <h2 class="settings-section-title">Storage</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('storage') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('storage')" class="settings-section-body">
            <div v-if="drive.loading && !drive.loaded" class="settings-loading">
              <Spinner :size="16" />
              <span>Loading...</span>
            </div>

            <template v-else>
              <!-- Not connected -->
              <div v-if="!drive.connected" class="settings-row settings-row--column">
                <span class="settings-value" data-testid="drive-status">Google Drive not connected</span>
                <span class="text-body-s settings-hint email-valueprop">Store your reference files and attachments in your own Google Drive. Files saved there don't count toward your storage limit.</span>
                <Btn variant="primary" size="sm" :loading="drive.acting" :disabled="drive.acting" data-testid="drive-connect" @click="onConnectDrive">Connect Google Drive</Btn>
              </div>

              <!-- Connected -->
              <div v-else class="settings-row">
                <span class="settings-label">Google Drive</span>
                <span class="settings-value color-text-success" data-testid="drive-status">Connected<template v-if="drive.email"> as {{ drive.email }}</template></span>
              </div>

              <div class="settings-row">
                <div>
                  <span class="settings-label">Save attachments to</span>
                </div>
                <div class="settings-control" :class="{ 'settings-control--saving': drive.savingDestination }">
                  <span v-if="drive.savingDestination" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                  <Select v-model="attachmentsDestination" :options="destinationOptions" :disabled="!drive.connected" title="Save attachments to" data-testid="drive-destination" />
                </div>
              </div>

              <div v-if="drive.connected" class="settings-row">
                <span class="settings-label">Disconnect</span>
                <Btn variant="ghost-danger" size="sm" :loading="drive.acting" :disabled="drive.acting" data-testid="drive-disconnect" @click="onDisconnectDrive">Disconnect</Btn>
              </div>
            </template>
          </div>
        </div>

        <!-- Reflect Section -->
        <div v-if="sectionVisible('review')" class="card">
          <div class="card-header card-header--toggle" @click="toggleSection('review')">
            <h2 class="settings-section-title">Reflect</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('review') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('review')" class="settings-section-body">
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

        <!-- Notifications Section -->
        <div v-if="sectionVisible('notifications')" class="card">
          <div class="card-header card-header--toggle" @click="toggleSection('notifications')">
            <h2 class="settings-section-title">Notifications</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('notifications') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('notifications')" class="settings-section-body">
            <div class="settings-row">
              <div>
                <span class="settings-label">Email notifications</span>
                <p class="text-body-s settings-hint">Receive email notifications for tasks and reminders</p>
              </div>
              <div class="settings-control" :class="{ 'settings-control--saving': notifications.state.saving.emailEnabled }">
                <span v-if="notifications.state.saving.emailEnabled" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                <label class="settings-toggle">
                  <input type="checkbox" v-model="emailEnabled" />
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="settings-row">
              <div>
                <span class="settings-label">Daily digest</span>
                <p class="text-body-s settings-hint">Daily email summarizing your today, next actions, and items due, sent in your selected timezone</p>
              </div>
              <div class="settings-control" :class="{ 'settings-control--saving': notifications.state.saving.dailyDigest }">
                <span v-if="notifications.state.saving.dailyDigest" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                <label class="settings-toggle">
                  <input type="checkbox" v-model="dailyDigest" :disabled="!notifications.state.emailEnabled" />
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="settings-row">
              <div>
                <span class="settings-label">Project needs next action</span>
                <p class="text-body-s settings-hint">Alert when a project has no next action defined</p>
              </div>
              <div class="settings-control" :class="{ 'settings-control--saving': notifications.state.saving.projectNeedsNextAction }">
                <span v-if="notifications.state.saving.projectNeedsNextAction" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                <label class="settings-toggle">
                  <input type="checkbox" v-model="projectNeedsNextAction" :disabled="!notifications.state.emailEnabled" />
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="settings-row">
              <div>
                <span class="settings-label">Delegated to you</span>
                <p class="text-body-s settings-hint">Email when a connection delegates an action to you</p>
              </div>
              <div class="settings-control" :class="{ 'settings-control--saving': notifications.state.saving.delegatedToYou }">
                <span v-if="notifications.state.saving.delegatedToYou" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                <label class="settings-toggle">
                  <input type="checkbox" v-model="delegatedToYou" :disabled="!notifications.state.emailEnabled" />
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="settings-row">
              <div>
                <span class="settings-label">Delegation completed</span>
                <p class="text-body-s settings-hint">Email when an action you delegated is completed</p>
              </div>
              <div class="settings-control" :class="{ 'settings-control--saving': notifications.state.saving.delegationCompleted }">
                <span v-if="notifications.state.saving.delegationCompleted" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                <label class="settings-toggle">
                  <input type="checkbox" v-model="delegationCompleted" :disabled="!notifications.state.emailEnabled" />
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="settings-row">
              <div>
                <span class="settings-label">Connection invitations</span>
                <p class="text-body-s settings-hint">Email when someone invites you to connect</p>
              </div>
              <div class="settings-control" :class="{ 'settings-control--saving': notifications.state.saving.connectionInvite }">
                <span v-if="notifications.state.saving.connectionInvite" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                <label class="settings-toggle">
                  <input type="checkbox" v-model="connectionInvite" :disabled="!notifications.state.emailEnabled" />
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="settings-row">
              <div>
                <span class="settings-label">Announcements</span>
                <p class="text-body-s settings-hint">Product news and feature announcements</p>
              </div>
              <div class="settings-control" :class="{ 'settings-control--saving': notifications.state.saving.announcement }">
                <span v-if="notifications.state.saving.announcement" class="settings-saving-spinner"><Spinner :size="18" class="settings-saving-spin" /></span>
                <label class="settings-toggle">
                  <input type="checkbox" v-model="announcement" :disabled="!notifications.state.emailEnabled" />
                  <span class="settings-toggle-slider"></span>
                </label>
              </div>
            </div>

            <p class="text-body-s settings-hint settings-info-note">In-app notifications are always on. Security emails (verification, password reset, login alerts) and service notices (terms, maintenance, security) cannot be disabled.</p>
          </div>
        </div>

        <!-- About Section -->
        <div v-if="sectionVisible('about')" class="card">
          <div class="card-header card-header--toggle" @click="toggleSection('about')">
            <h2 class="settings-section-title">About</h2>
            <span class="section-chevron" :class="{ 'section-chevron--open': isExpanded('about') }">&#8250;</span>
          </div>
          <div v-if="isExpanded('about')" class="settings-section-body">
            <div class="settings-row">
              <span class="settings-label">Version</span>
              <span class="settings-value">{{ appVersion }}</span>
            </div>

          </div>
        </div>

      </div>

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
import { notificationModel } from '../../scripts/models/notificationModel.js'
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
const { paymentsEnabled, hasFlag } = flagsModel()
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

const SECTION_KEYWORDS = {
  account: 'account email password login delete remove',
  plan: 'plan tier subscription free pro team projects tags storage limits upgrade billing renew cancel payment invoice',
  assistant: 'ai assistant credits buy pack model memory conversation',
  emailInbox: 'email inbox capture address forward generate reset pause',
  sessions: 'sessions devices logout active current',
  aiApps: 'ai apps mcp claude chatgpt connector connected assistant',
  application: 'application theme dark light position new items timezone time zone',
  tags: 'tags presets quick add',
  calendar: 'calendar week start time format business hours days',
  calendarSync: 'calendar sync google connect disconnect reconnect sync now events timezone',
  storage: 'storage google drive connect disconnect reconnect attachments reference files local',
  review: 'reflect review weekly sidebar horizons focus areas goals vision purpose',
  notifications: 'notifications email reminder daily digest next actions project announcements',
  about: 'about version',
}

function sectionVisible(name) {
  if (!searchQuery.value.trim()) return true
  const q = searchQuery.value.toLowerCase()
  return SECTION_KEYWORDS[name]?.includes(q) ?? false
}

function onSearchInput() {
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    for (const name in SECTION_KEYWORDS) {
      if (SECTION_KEYWORDS[name].includes(q)) {
        expandedSections.value.add(name)
      }
    }
  }
}

// Collapsible sections — all expanded by default
const expandedSections = ref(new Set(Object.keys(SECTION_KEYWORDS)))

function toggleSection(name) {
  if (expandedSections.value.has(name)) {
    expandedSections.value.delete(name)
  } else {
    expandedSections.value.add(name)
  }
}

function isExpanded(name) {
  return expandedSections.value.has(name)
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
  { value: 'local', label: 'Local' },
  { value: 'gdrive', label: 'Google Drive' },
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
  { value: 'system', label: 'System Default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
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

const emailEnabled = computed({
  get: () => notifications.state.emailEnabled,
  set: (val) => notifications.setEmailEnabled(val).catch(() => toaster.push('Failed to save notification setting'))
})

const dailyDigest = computed({
  get: () => notifications.state.dailyDigest,
  set: (val) => notifications.setDailyDigest(val).catch(() => toaster.push('Failed to save notification setting'))
})

const projectNeedsNextAction = computed({
  get: () => notifications.state.projectNeedsNextAction,
  set: (val) => notifications.setProjectNeedsNextAction(val).catch(() => toaster.push('Failed to save notification setting'))
})

const delegatedToYou = computed({
  get: () => notifications.state.delegatedToYou,
  set: (val) => notifications.setDelegatedToYou(val).catch(() => toaster.push('Failed to save notification setting'))
})

const delegationCompleted = computed({
  get: () => notifications.state.delegationCompleted,
  set: (val) => notifications.setDelegationCompleted(val).catch(() => toaster.push('Failed to save notification setting'))
})

const connectionInvite = computed({
  get: () => notifications.state.connectionInvite,
  set: (val) => notifications.setConnectionInvite(val).catch(() => toaster.push('Failed to save notification setting'))
})

const announcement = computed({
  get: () => notifications.state.announcement,
  set: (val) => notifications.setAnnouncement(val).catch(() => toaster.push('Failed to save notification setting'))
})

const positionOptions = [
  { value: 'end', label: 'End' },
  { value: 'beginning', label: 'Beginning' }
]

// Calendar preferences - computed from settings model
const weekStart = computed({
  get: () => settings.state.weekStart,
  set: (val) => settings.setWeekStart(val).catch(() => toaster.push('Failed to save setting'))
})

const weekStartOptions = [
  { value: 'mon', label: 'Monday' },
  { value: 'sun', label: 'Sunday' },
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
  { value: '12h', label: '12-hour (AM/PM)' },
  { value: '24h', label: '24-hour' }
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
  loadStats() // deep-linked /settings may mount before the sidebar populates stats
  loadSessions()
  loadAiApps()
  settings.load().catch(() => {
    // Settings will fall back to localStorage, no need to show error
  })
  notifications.load().catch(() => {
    // Notification settings will fall back to defaults
  })

  loadInboxEmail()
  applyCalendarConnectReturn()
  loadCalendarSync()
  loadDriveStorage()
  loadPaymentStatus()
  loadAssistant()

  applySectionQuery()
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

watch(() => route.query.section, applySectionQuery)

function applySectionQuery() {
  let target = route.query.section
  if (target === 'billing') target = 'plan'   // Paywiser checkout returns to /settings/billing
  if (typeof target === 'string' && SECTION_KEYWORDS[target]) {
    expandedSections.value.add(target)
  }
}

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  if (copiedTimer) clearTimeout(copiedTimer)
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

function getDeviceIcon(session) {
  const device = (session.device || '').toLowerCase()
  if (device.includes('mobile') || device.includes('iphone') || device.includes('android')) {
    return '📱'
  }
  if (device.includes('tablet') || device.includes('ipad')) {
    return '📱'
  }
  return '💻'
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

.card-header--toggle {
  cursor: pointer;
  user-select: none;
}

.card-header--toggle:only-child {
  border-bottom: none !important;
}

.card-header--toggle:hover {
  background: var(--color-bg-secondary);
}

.section-chevron {
  font-size: 18px;
  color: var(--color-text-tertiary);
  transition: transform 0.15s ease;
  transform: rotate(0deg);
  line-height: 1;
}

.section-chevron--open {
  transform: rotate(90deg);
}

.settings-header {
  flex-shrink: 0;
  padding: 0 16px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 20px;
  touch-action: pan-y;
}

/* Section title in card header */
.settings-section-title {
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-family-default);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  line-height: 13px;
  color: var(--color-action);
  margin: 0;
}

.settings-section-body {
  padding: 0 20px;
}

/* Rows */
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border-subtle);
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

/* The hint wraps, the button keeps one line */
.assistant-buy-btn {
  flex-shrink: 0;
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

.settings-tags-display {
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  width: 100%;
}

.settings-tags-display:hover {
  background: var(--color-bg-secondary);
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

.settings-tag-placeholder {
  color: var(--color-text-tertiary);
  font-style: italic;
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
  margin-top: 8px;
  font-style: italic;
}

/* Email to Inbox */
.email-locked,
.email-valueprop {
  line-height: var(--lh-normal);
}

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

.session-item--current {
  border-bottom: 1px solid var(--color-border-subtle);
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

.session-icon {
  font-size: var(--font-size-md);
}

.session-name {
  color: var(--color-text-primary);
}

.session-badge {
  color: var(--color-action);
  background: var(--color-action-subtle);
  padding: 2px 6px;
  border-radius: 4px;
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

/* The address row follows the last app, so that row keeps its divider */
.ai-apps-list .session-item:last-child {
  border-bottom: 1px solid var(--color-border-subtle);
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
  .settings-body {
    padding: 12px;
  }

  .settings-row {
    padding: 12px 0;
  }

  .session-item--current {
    margin: 0 -8px;
    padding: 12px 8px;
  }

  .session-name {
    word-break: break-word;
  }
}
</style>
