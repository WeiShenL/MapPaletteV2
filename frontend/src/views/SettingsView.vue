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
                        <img :src="userProfile.avatar || '/resources/images/default-profile.png'" 
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
                      <button v-if="userProfile.avatar && !userProfile.avatar.includes('default-profile.png')" 
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

                <!-- Cover Photo -->
                <div class="mb-4">
                  <h6 class="fw-bold mb-3">Cover Photo</h6>
                  <div class="cover-photo-preview mb-3">
                    <img :src="userProfile.coverPhoto || '/resources/coverphoto_profile.jpg'" 
                      alt="Cover Photo" 
                      class="img-fluid rounded">
                  </div>
                  <input type="file" ref="coverInput" @change="handleCoverUpload" accept="image/*" style="display: none;">
                  <div class="d-flex gap-2">
                    <button class="btn btn-outline-primary" @click="$refs.coverInput.click()">
                      <i class="bi bi-image me-1"></i>
                      Change Cover
                    </button>
                    <button v-if="userProfile.coverPhoto" 
                        class="btn btn-outline-danger" 
                        @click="removeCoverPhoto">
                      <i class="bi bi-trash me-1"></i>
                      Remove
                    </button>
                  </div>
                </div>

                <!-- Username Form -->
                <form class="profile-form" @submit.prevent>
                  <div class="mb-3">
                    <label class="form-label fw-bold">Username</label>
                    <div class="input-group">
                      <input type="text" class="form-control" v-model="userProfile.username">
                      <button class="btn btn-outline-secondary" type="button" @click="updateUsername">
                        <i class="bi bi-pencil"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Bio -->
                  <div class="mb-3">
                    <label class="form-label fw-bold">Bio / Tagline</label>
                    <textarea 
                      class="form-control" 
                      v-model="userProfile.bio" 
                      rows="3" 
                      maxlength="200"
                      placeholder="Tell others about yourself..."></textarea>
                    <small class="text-muted">{{ (userProfile.bio || '').length }}/200 characters</small>
                  </div>

                  <!-- Location -->
                  <div class="mb-3">
                    <label class="form-label fw-bold">Location</label>
                    <div class="input-group">
                      <span class="input-group-text"><i class="bi bi-geo-alt"></i></span>
                      <input type="text" class="form-control" v-model="userProfile.location" placeholder="e.g., Singapore">
                    </div>
                  </div>

                  <!-- Birthday -->
                  <div class="mb-3">
                    <label class="form-label fw-bold">Birthday</label>
                    <input type="date" class="form-control" v-model="userProfile.birthday">
                  </div>

                  <!-- Visibility Toggles -->
                  <div class="mb-4">
                    <h6 class="fw-bold mb-3">Visibility Settings</h6>
                    <div class="form-check form-switch mb-2">
                      <input class="form-check-input" type="checkbox" id="showLocation" v-model="userProfile.showLocation">
                      <label class="form-check-label" for="showLocation">
                        <i class="bi bi-geo-alt me-1"></i> Show location on profile
                      </label>
                    </div>
                    <div class="form-check form-switch mb-2">
                      <input class="form-check-input" type="checkbox" id="showBirthday" v-model="userProfile.showBirthday">
                      <label class="form-check-label" for="showBirthday">
                        <i class="bi bi-calendar3 me-1"></i> Show birthday on profile
                      </label>
                    </div>
                  </div>

                  <!-- Save Profile Button -->
                  <button class="btn btn-primary" @click="saveProfileInfo">
                    <i class="bi bi-check-lg me-1"></i> Save Profile
                  </button>
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
import { useRouter } from 'vue-router';
import axios from '@/lib/axios';
import { useAuth } from '@/composables/useAuth';
import { useAlert } from '@/composables/useAlert';
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
    const router = useRouter();
    const { currentUser, getToken, updateProfilePicture: updateGlobalProfilePicture, updateUsername: updateGlobalUsername } = useAuth();
    const { showAlert, alertType, alertMessage, setAlert } = useAlert();

    const currentTab = ref('profile');
    const userProfile = ref({
      username: '',
      avatar: '/resources/images/default-profile.png',
      coverPhoto: '',
      bio: '',
      location: '',
      birthday: '',
      showBirthday: true,
      showLocation: true,
    });
    const coverInput = ref(null);
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
    const photoAlert = ref({
      show: false,
      type: 'success',
      message: ''
    });

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
        await axios.put(
          `/api/users/update/username/${currentUser.value.id}`,
          { username: userProfile.value.username }
        );
        setAlert('success', 'Username updated successfully!');
      } catch (error) {
        console.error('Error updating username:', error);
        setAlert('error', 'An error occurred while updating username.');
      }
    };

    const handleImageUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setAlert('error', 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setAlert('error', 'File too large. Maximum size is 5MB.');
        return;
      }

      try {
        // Use backend API for upload (same as signup page)
        // This uses the service role key which bypasses RLS issues
        const formData = new FormData();
        formData.append('profilePicture', file);

        const uploadResponse = await axios.post(
          `/api/users/upload-profile-picture/${currentUser.value.id}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000 // 30 second timeout
          }
        );

        if (uploadResponse.data && uploadResponse.data.url) {
          userProfile.value.avatar = uploadResponse.data.url;
          // Also update navbar
          if (navbarUserProfile.value) {
            navbarUserProfile.value.avatar = uploadResponse.data.url;
          }
          // Update global auth state so all components get the new picture
          updateGlobalProfilePicture(uploadResponse.data.url);
          setAlert('success', 'Profile picture updated successfully!');
        } else {
          setAlert('error', 'Failed to upload image. Please try again.');
        }
      } catch (error) {
        console.error('Error updating profile picture:', error);
        const errorMessage = error.response?.data?.message || 'An error occurred while updating the profile picture.';
        setAlert('error', errorMessage);
      }

      // Clear the file input so the same file can be selected again
      event.target.value = '';
    };

    const removeProfilePicture = async () => {
      try {
        const defaultPicture = '/resources/images/default-profile.png';
        await updateUserProfilePicture(defaultPicture);
        userProfile.value.avatar = defaultPicture;
        if (navbarUserProfile.value) {
          navbarUserProfile.value.avatar = defaultPicture;
        }
        // Update global auth state so all components get the default picture
        updateGlobalProfilePicture(defaultPicture);
        setAlert('success', 'Profile picture removed successfully.');
      } catch (error) {
        console.error('Error removing profile picture:', error);
        setAlert('error', 'An error occurred while removing the profile picture.');
      }
    };

    const handleCoverUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setAlert('error', 'Invalid file type. Please upload a JPEG, PNG, or WebP image.');
        return;
      }

      // Validate file size (10MB max for cover photos)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setAlert('error', 'File too large. Maximum size is 10MB.');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('coverPhoto', file);

        const uploadResponse = await axios.post(
          `/api/users/upload-cover-photo/${currentUser.value.id}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000
          }
        );

        if (uploadResponse.data && uploadResponse.data.url) {
          userProfile.value.coverPhoto = uploadResponse.data.url;
          setAlert('success', 'Cover photo updated successfully!');
        } else {
          setAlert('error', 'Failed to upload cover photo. Please try again.');
        }
      } catch (error) {
        console.error('Error uploading cover photo:', error);
        setAlert('error', error.response?.data?.message || 'An error occurred while uploading the cover photo.');
      }
      event.target.value = '';
    };

    const removeCoverPhoto = async () => {
      try {
        await axios.put(`/api/users/update/coverPhoto/${currentUser.value.id}`, { coverPhoto: null });
        userProfile.value.coverPhoto = '';
        setAlert('success', 'Cover photo removed successfully.');
      } catch (error) {
        console.error('Error removing cover photo:', error);
        setAlert('error', 'An error occurred while removing the cover photo.');
      }
    };

    const saveProfileInfo = async () => {
      try {
        await axios.put(`/api/users/${currentUser.value.id}/profile-info`, {
          bio: userProfile.value.bio,
          location: userProfile.value.location,
          birthday: userProfile.value.birthday,
          showBirthday: userProfile.value.showBirthday,
          showLocation: userProfile.value.showLocation,
        });
        setAlert('success', 'Profile information saved successfully!');
      } catch (error) {
        console.error('Error saving profile info:', error);
        setAlert('error', error.response?.data?.message || 'An error occurred while saving profile information.');
      }
    };
    
    const savePrivacySettings = async () => {
      destroyTooltips();
      try {
        await axios.put(
          `/api/users/${currentUser.value.id}/privacy`,
          {
            isProfilePrivate: privacySettings.value.keepProfilePrivate,
            isPostPrivate: privacySettings.value.keepPostPrivate
          }
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
          const response = await axios.get(`/api/users/${currentUser.value.id}`);
          const userData = response.data;
          
          userProfile.value = {
            username: userData.username || '',
            avatar: userData.profilePicture || '/resources/images/default-profile.png',
            coverPhoto: userData.coverPhoto || '',
            bio: userData.bio || '',
            location: userData.location || '',
            birthday: userData.birthday || '',
            showBirthday: userData.showBirthday ?? true,
            showLocation: userData.showLocation ?? true,
          };
          navbarUserProfile.value = {
            name: userData.username || '',
            username: userData.username || '',
            avatar: userData.profilePicture || '/resources/images/default-profile.png'
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
        await axios.put(
          `/api/users/update/profilePicture/${currentUser.value.id}`,
          { profilePicture: imageUrl }
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
      coverInput,
      photoAlert,
      switchTab,
      updateUsername,
      handleImageUpload,
      removeProfilePicture,
      handleCoverUpload,
      removeCoverPhoto,
      saveProfileInfo,
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