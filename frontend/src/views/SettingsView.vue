<template>
  <div class="settings-page">
    <!-- Navbar -->
    <NavBar :user-profile="navbarUserProfile" />
    
    <!-- Main content wrapper -->
    <div class="main-content-wrapper">
      <div class="container-fluid mt-4">
        <div class="row">
          <!-- Settings Sidebar -->
          <div class="col-lg-3 col-md-12">
            <div class="settings-sidebar bg-white p-4 rounded shadow-sm">
              <h5 class="fw-bold mb-4">Settings</h5>
              <div class="settings-nav">
                <a v-for="item in navItems" 
                :key="item.id"
                href="#"
                class="settings-nav-item mb-2 text-decoration-none"
                :class="{ 'active': currentTab === item.id }"
                @click.prevent="switchTab(item.id)">
                  <div class="d-flex align-items-start w-100">
                    <div class="me-3">
                      <i :class="item.icon + ' fs-5'"></i>
                    </div>
                    <div class="flex-grow-1">
                      <div class="fw-medium">{{ item.label }}</div>
                      <small class="text-muted">{{ item.description }}</small>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div class="col-lg-1"></div>
          <!-- Settings Content -->
          <div class="col-lg-7 col-md-12">
            <div class="settings-content bg-white p-4 rounded shadow-sm">
              <!-- Profile Section -->
              <div v-if="currentTab === 'profile'" class="settings-section">
                <h3 class="mb-4">My Profile</h3>
                
                <!-- Profile Picture -->
                <div class="text-center mb-4">
                  <h6 class="fw-bold mb-0">Profile Picture</h6>
                  <div class="profile-picture-container">
                    <!-- Profile picture preview container -->
                    <div id="file-preview-wrapper">
                      <div id="file-preview">
                        <img :src="userProfile.avatar || '/resources/default-profile.png'" 
                          alt="Profile Picture" 
                          id="profile-pic-img">
                      </div>
                    </div>
            
                    <!-- Hidden file input for image upload -->
                    <input type="file" ref="fileInput" @change="handleImageUpload" accept="image/*" style="display: none;">
            
                    <!-- Profile picture action buttons -->
                    <div class="profile-picture-buttons mt-3">
                      <button class="btn btn-primary me-2" @click="$refs.fileInput.click()">
                        <i class="bi bi-camera-fill me-1"></i>
                        Change Picture
                      </button>
                      <button v-if="userProfile.avatar !== '/resources/default-profile.png'" 
                          class="btn btn-outline-danger" 
                          @click="removeProfilePicture">
                        <i class="bi bi-trash me-1"></i>
                        Remove
                      </button>
                    </div>
                  </div>
                  <!-- Photo Alert -->
                  <div v-if="photoAlert.show" 
                    class="alert" 
                    :class="'alert-' + photoAlert.type" 
                    role="alert">
                    {{ photoAlert.message }}
                  </div>
                </div>                                

                <!-- Username Form -->
                <form class="profile-form">
                  <div class="mb-3">
                    <label class="form-label">Username</label>
                    <div class="input-group">
                      <input type="text" class="form-control" v-model="userProfile.username">
                      <button class="btn btn-outline-secondary" type="button" @click="updateUsername">
                        <i class="bi bi-pencil"></i>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Privacy Section --> 
              <div v-if="currentTab === 'privacy'" class="settings-section">
                <h3 class="mb-4">Privacy</h3>
                
                 <!-- Keep Profile Private Checkbox -->
                 <label class="form-check mb-3 privacy-checkbox-wrapper"
                    data-bs-toggle="tooltip"
                    data-bs-placement="right"
                    data-bs-html="true"
                    data-bs-custom-class="fancy-tooltip"
                    title="<div class='tooltip-icon'><i class='bi bi-shield-lock'></i></div>
                            <div class='tooltip-content'>
                            <h6>Profile Privacy</h6>
                            <p>When enabled, your profile will not be visible to all users</p>
                            </div>">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      v-model="privacySettings.keepProfilePrivate" 
                      id="keepProfilePrivate"
                      @click="handlePrivacyCheckboxClick">
                    <span class="form-check-label">
                      Keep Profile Private
                    </span>
                </label>

                <!-- Keep Post Private Checkbox -->
                <label class="form-check mb-3 privacy-checkbox-wrapper"
                    data-bs-toggle="tooltip"
                    data-bs-placement="right"
                    data-bs-html="true"
                    data-bs-custom-class="fancy-tooltip"
                    title="<div class='tooltip-icon'><i class='bi bi-eye-slash'></i></div>
                            <div class='tooltip-content'>
                            <h6>Post Privacy</h6>
                            <p>When enabled, your posts will not be visible to all users</p>
                            </div>">
                    <input 
                      class="form-check-input" 
                      type="checkbox" 
                      v-model="privacySettings.keepPostPrivate" 
                      id="keepPostPrivate"
                      @click="handlePrivacyCheckboxClick">
                    <span class="form-check-label">
                      Keep Post Private
                    </span>
                </label>

                <!-- Save Button -->
                <button @click="savePrivacySettings" class="btn btn-primary mt-3">Save Changes</button>

                <!-- Success Alert -->
                <div v-if="showAlert" class="alert alert-success mt-3" role="alert">
                  Privacy settings saved successfully!
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-1"></div>
        </div>
      </div>
    </div>
    
    <!-- Footer Section -->
    <SiteFooter />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';
import { useAuth } from '@/composables/useAuth';
import { useAlert } from '@/composables/useAlert';
import { uploadProfilePicture, deleteOldProfilePicture as deleteFromStorage } from '@/lib/storage';
import NavBar from '@/components/layout/NavBar.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';
import AlertNotification from '@/components/common/AlertNotification.vue';

export default {
  name: 'SettingsView',
  components: {
    NavBar,
    SiteFooter,
    AlertNotification
  },
  setup() {
    const { currentUser, getToken } = useAuth();
    const { showAlert, alertType, alertMessage, setAlert } = useAlert();

    const currentTab = ref('profile');
    const userProfile = ref({
      username: '',
      avatar: '/resources/default-profile.png',
    });
    const navbarUserProfile = ref(null);
    const navItems = ref([
        { id: 'profile', icon: 'bi bi-person', label: 'Profile Settings', description: 'Manage your personal information' },
        { id: 'privacy', icon: 'bi bi-eye', label: 'Privacy', description: 'Control your privacy settings' }
    ]);
    const privacySettings = ref({
        keepProfilePrivate: false,
        keepPostPrivate: false
    });
    const tooltipInstances = ref([]);
    const tooltipInitTimeout = ref(null);
    const fileInput = ref(null);

    const initTooltips = () => {
      destroyTooltips();
      clearTimeout(tooltipInitTimeout.value);
      tooltipInitTimeout.value = setTimeout(() => {
        if (typeof window !== 'undefined' && window.bootstrap) {
          const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
          tooltipInstances.value = Array.from(tooltipTriggerList).map(el => new window.bootstrap.Tooltip(el, { trigger: 'hover' }));
        }
      }, 200);
    };

    const destroyTooltips = () => {
      tooltipInstances.value.forEach(tooltip => tooltip?.dispose());
      tooltipInstances.value = [];
    };

    const switchTab = (tabId) => {
      currentTab.value = tabId;
      nextTick(initTooltips);
    };

    const updateUsername = async () => {
      try {
        const token = await getToken();
        await axios.put(
          `http://localhost:3001/api/users/update/username/${currentUser.value.id}`,
          { username: userProfile.value.username },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setAlert('success', 'Username updated successfully!');
      } catch (error) {
        console.error('Error updating username:', error);
        setAlert('error', 'An error occurred while updating username.');
      }
    };

    const deleteOldProfilePicture = async (oldImageUrl) => {
      try {
        const result = await deleteFromStorage(oldImageUrl);
        if (!result.success) console.warn('Could not delete old profile picture:', result.error);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
      }
    };

    const handleImageUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const oldImageUrl = userProfile.value.avatar;
        const uploadResult = await uploadProfilePicture(file, currentUser.value.id);

        if (!uploadResult.success) {
          setAlert('error', uploadResult.error || 'Failed to upload image');
          return;
        }

        await updateUserProfilePicture(uploadResult.url);
        userProfile.value.avatar = uploadResult.url;
        await deleteOldProfilePicture(oldImageUrl);
        setAlert('success', 'Profile picture updated successfully!');
      } catch (error) {
        console.error('Error updating profile picture:', error);
        setAlert('error', 'An error occurred while updating the profile picture.');
      }
    };

    const removeProfilePicture = async () => {
      const oldImageUrl = userProfile.value.avatar;
      try {
        await updateUserProfilePicture('/resources/default-profile.png');
        userProfile.value.avatar = '/resources/default-profile.png';
        await deleteOldProfilePicture(oldImageUrl);
        setAlert('success', 'Profile picture removed successfully.');
      } catch (error) {
        console.error('Error removing profile picture:', error);
        setAlert('error', 'An error occurred while removing the profile picture.');
      }
    };
    
    const savePrivacySettings = async () => {
      destroyTooltips();
      try {
        const token = await getToken();
        await axios.put(
          `http://localhost:3001/api/users/${currentUser.value.id}/privacy`,
          {
            isProfilePrivate: privacySettings.value.keepProfilePrivate,
            isPostPrivate: privacySettings.value.keepPostPrivate
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setAlert('success', 'Privacy settings saved successfully!');
        setTimeout(initTooltips, 3000);
      } catch (error) {
        console.error('Error saving privacy settings:', error);
        setAlert('error', 'An error occurred while saving privacy settings.');
        initTooltips();
      }
    };

    const initUserData = async () => {
      if (currentUser.value) {
        try {
          const response = await axios.get(`http://localhost:3001/api/users/${currentUser.value.id}`);
          const userData = response.data;
          
          userProfile.value = {
            username: userData.username || '',
            avatar: userData.profilePicture || '/resources/default-profile.png'
          };
          navbarUserProfile.value = {
            name: userData.username || '',
            username: userData.username || '',
            avatar: userData.profilePicture || '/resources/default-profile.png'
          };
          privacySettings.value = {
            keepProfilePrivate: userData.isProfilePrivate ?? false,
            keepPostPrivate: userData.isPostPrivate ?? false
          };
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        router.push('/login');
      }
    };

    const updateUserProfilePicture = async (imageUrl) => {
      try {
        const token = await getToken();
        await axios.put(
          `http://localhost:3001/api/users/update/profilePicture/${currentUser.value.id}`,
          { profilePicture: imageUrl },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        userProfile.value.avatar = imageUrl;
      } catch (error) {
        console.error('Error updating profile picture URL:', error);
        setAlert('error', 'Error updating profile picture URL.');
      }
    };

    onMounted(() => {
      initUserData();
      nextTick(initTooltips);
    });

    onUnmounted(() => {
      destroyTooltips();
      clearTimeout(tooltipInitTimeout.value);
    });

    return {
      currentTab,
      userProfile,
      navbarUserProfile,
      navItems,
      privacySettings,
      showAlert,
      alertType,
      alertMessage,
      fileInput,
      switchTab,
      updateUsername,
      handleImageUpload,
      removeProfilePicture,
      savePrivacySettings,
    };
  }
};
</script>

<style scoped>
@import '@/assets/styles/settings.css';

.settings-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.main-content-wrapper {
  flex: 1;
  padding-top: 67px; 
  padding-bottom: 2rem; 
}

:root {
  --navbar-height: 67px;
  --primary-color-rgb: 255, 107, 107;
}

.settings-page > :last-child {
  margin-top: auto;
}
</style>