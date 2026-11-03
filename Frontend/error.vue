<template>
  <div class="error-page">
    <div class="ui-container">
      <div class="ui-row justify-center items-center" style="min-height: 100vh;">
        <div class="ui-col ui-col-12 ui-col-md-6 text-center">
          <UiIcon :icon="errorIcon" :size="120" :color="errorColor" class="mb-4" />

          <h1 class="error-code font-bold mb-4">
            {{ error.statusCode }}
          </h1>

          <h2 class="error-title mb-4">
            {{ errorTitle }}
          </h2>

          <p class="text-base mb-6">
            {{ errorMessage }}
          </p>

          <div class="flex justify-center gap-4 flex-wrap">
            <UiBtn color="primary" size="large" prepend-icon="mdi-refresh" @click="handleError">
              Try Again
            </UiBtn>

            <UiBtn variant="outlined" color="primary" size="large" prepend-icon="mdi-home" @click="$router.push('/')">
              Go Home
            </UiBtn>
          </div>

          <!-- Additional help for 403 errors -->
          <div v-if="error.statusCode === 403" class="mt-6">
            <UiAlert type="info" variant="tonal" title="Need Access?" class="text-left">
              <p class="mb-2">
                If you believe you should have access to this resource, please contact your administrator.
              </p>
              <UiBtn variant="text" size="small" color="info" @click="contactSupport">
                Contact Support
              </UiBtn>
            </UiAlert>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Props
const props = defineProps<{
  error: {
    statusCode: number
    statusMessage: string
  }
}>()

// Computed
const errorColor = computed(() => {
  switch (props.error.statusCode) {
    case 403: return 'warning'
    case 404: return 'info'
    case 500: return 'error'
    default: return 'error'
  }
})

const errorIcon = computed(() => {
  switch (props.error.statusCode) {
    case 403: return 'mdi-lock'
    case 404: return 'mdi-file-search'
    case 500: return 'mdi-server-network-off'
    default: return 'mdi-alert-circle'
  }
})

const errorTitle = computed(() => {
  switch (props.error.statusCode) {
    case 403: return 'Access Denied'
    case 404: return 'Page Not Found'
    case 500: return 'Server Error'
    default: return 'Something went wrong'
  }
})

const errorMessage = computed(() => {
  switch (props.error.statusCode) {
    case 403: 
      return 'You don\'t have permission to access this resource. Please check your credentials or contact an administrator.'
    case 404: 
      return 'The page you\'re looking for doesn\'t exist. It might have been moved, deleted, or you entered the wrong URL.'
    case 500: 
      return 'An internal server error occurred. Our team has been notified and is working to fix this issue.'
    default: 
      return props.error.statusMessage || 'An unexpected error occurred. Please try again later.'
  }
})

// Methods
const handleError = () => {
  clearError({ redirect: '/' })
}

const contactSupport = () => {
  // You can implement email mailto or support ticket system
  window.location.href = 'mailto:support@jtwbaseauth.com?subject=Access Request&body=I need access to a restricted resource.'
}


</script>

<style scoped>
.error-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

/* Vuetify text-h2 / text-h4 ölçüleri */
.error-code {
  font-size: 3.75rem;
  line-height: 3.75rem;
  letter-spacing: -0.0083333333em;
}

.error-title {
  font-size: 2.125rem;
  line-height: 2.5rem;
  letter-spacing: 0.0073529412em;
}
</style> 