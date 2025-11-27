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
import axios from 'axios';
import { getCurrentUser, getToken } from '@/services/authService';
import { uploadProfilePicture, deleteOldProfilePicture as deleteFromStorage } from '@/lib/storage';
import NavBar from '@/components/layout/NavBar.vue';
import SiteFooter from '@/components/layout/SiteFooter.vue';

export default {
  name: 'SettingsView',
  components: {
    NavBar,
    SiteFooter
  },
  data() {
    return {
      currentTab: 'profile',
      currentUserId: null,
      userProfile: {
        username: '',
        avatar: '/resources/default-profile.png',
      },
      navbarUserProfile: window.currentUser ? {
        name: window.currentUser.username || '',
        username: window.currentUser.username || '',
        avatar: window.currentUser.profilePicture || '/resources/images/default-profile.png'
      } : null,
      navItems: [
        {
          id: 'profile',
          icon: 'bi bi-person',
          label: 'Profile Settings',
          description: 'Manage your personal information'
        },
        {
          id: 'privacy',
          icon: 'bi bi-eye',
          label: 'Privacy',
          description: 'Control your privacy settings'
        }
      ],
      privacySettings: {
        keepProfilePrivate: false,
        keepPostPrivate: false
      },
      showAlert: false,
      photoAlert: {
        show: false,
        message: '',
        type: 'success'
      },
      tooltipInstances: [],
      tooltipInitTimeout: null
    }
  },
  methods: {
    initTooltips() {
      // Clear any existing tooltip instances
      this.destroyTooltips();
      
      // Debounce the initialization
      clearTimeout(this.tooltipInitTimeout);
      this.tooltipInitTimeout = setTimeout(() => {
        if (typeof window !== 'undefined' && window.bootstrap) {
          const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
          this.tooltipInstances = Array.from(tooltipTriggerList).map(el => {
            return new window.bootstrap.Tooltip(el, {
              trigger: 'hover'
            });
          });
        }
      }, 200);
    },

    destroyTooltips() {
      this.tooltipInstances.forEach(tooltip => {
        if (tooltip) {
          tooltip.dispose();
        }
      });
      this.tooltipInstances = [];
    },

    switchTab(tabId) {
      this.currentTab = tabId;
      this.$nextTick(() => {
        this.initTooltips();
      });
    },

    handlePrivacyCheckboxClick() {
      // Handle checkbox click if needed
    },

    async updateUsername() {
      try {
        const token = await getToken();
        await axios.put(
          `http://localhost:3001/api/users/update/username/${this.currentUserId}`,
          { username: this.userProfile.username },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        this.photoAlert.type = 'success';
        this.photoAlert.message = 'Username updated successfully!';
        this.photoAlert.show = true;
        setTimeout(() => {
          this.photoAlert.show = false;
        }, 3000);
      } catch (error) {
        console.error('Error updating username:', error);
        this.photoAlert.type = 'danger';
        this.photoAlert.message = 'An error occurred while updating username.';
        this.photoAlert.show = true;
        setTimeout(() => {
          this.photoAlert.show = false;
        }, 3000);
      }
    },

    async deleteOldProfilePicture(oldImageUrl) {
      try {
        // Delete from Supabase Storage using the utility function
        const result = await deleteFromStorage(oldImageUrl);
        if (!result.success) {
          console.warn('Could not delete old profile picture:', result.error);
        }
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
      }
    },

    async handleImageUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      try {
        // Store the old image URL before updating
        const oldImageUrl = this.userProfile.avatar;

        // Upload to Supabase Storage
        const uploadResult = await uploadProfilePicture(file, this.currentUserId);

        if (!uploadResult.success) {
          this.photoAlert.type = 'danger';
          this.photoAlert.message = uploadResult.error || 'Failed to upload image';
          this.photoAlert.show = true;
          setTimeout(() => {
            this.photoAlert.show = false;
          }, 3000);
          return;
        }

        const imageUrl = uploadResult.url;

        // Update the profile picture URL in the database
        await this.updateUserProfilePicture(imageUrl);

        // Update local state
        this.userProfile.avatar = imageUrl;

        // Delete the old image from storage (if it exists and is not default)
        await this.deleteOldProfilePicture(oldImageUrl);

        this.photoAlert.type = 'success';
        this.photoAlert.message = 'Profile picture updated successfully!';
        this.photoAlert.show = true;
        setTimeout(() => {
          this.photoAlert.show = false;
        }, 3000);
      } catch (error) {
        console.error('Error updating profile picture:', error);
        this.photoAlert.type = 'danger';
        this.photoAlert.message = 'An error occurred while updating the profile picture.';
        this.photoAlert.show = true;
        setTimeout(() => {
          this.photoAlert.show = false;
        }, 3000);
      }
    },

    async removeProfilePicture() {
      const oldImageUrl = this.userProfile.avatar;
      
      try {
        const token = await getToken();
        await axios.put(
          `http://localhost:3001/api/users/update/profilePicture/${this.currentUserId}`,
          { profilePicture: '/resources/default-profile.png' },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        // Update local state
        this.userProfile.avatar = '/resources/default-profile.png';
        
        // Delete the old image from storage
        await this.deleteOldProfilePicture(oldImageUrl);
        
        this.photoAlert.type = 'success';
        this.photoAlert.message = 'Profile picture removed successfully.';
        this.photoAlert.show = true;
        setTimeout(() => {
          this.photoAlert.show = false;
        }, 3000);
      } catch (error) {
        console.error('Error removing profile picture:', error);
        this.photoAlert.type = 'danger';
        this.photoAlert.message = 'An error occurred while removing the profile picture.';
        this.photoAlert.show = true;
        setTimeout(() => {
          this.photoAlert.show = false;
        }, 3000);
      }
    },
    
    async savePrivacySettings() {
      this.destroyTooltips(); 

      try {
        const token = await getToken();
        await axios.put(
          `http://localhost:3001/api/users/${this.currentUserId}/privacy`,
          {
            isProfilePrivate: this.privacySettings.keepProfilePrivate,
            isPostPrivate: this.privacySettings.keepPostPrivate
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        this.showAlert = true;
        setTimeout(() => {
          this.showAlert = false;
          this.initTooltips(); 
        }, 3000);
      } catch (error) {
        console.error('Error saving privacy settings:', error);
        alert('An error occurred while saving privacy settings.');
        this.initTooltips();
      }
    },

    async initUserData() {
      const currentUser = getCurrentUser();
      if (currentUser) {
        this.currentUserId = currentUser.uid;
        
        try {
          const response = await axios.get(`http://localhost:3001/api/users/${this.currentUserId}`);
          const userData = response.data;
          
          this.userProfile = {
            username: userData.username || '',
            avatar: userData.profilePicture || '/resources/default-profile.png'
          };

          // Set navbar user profile (this determines which navbar to show)
          this.navbarUserProfile = {
            name: userData.username || '',
            username: userData.username || '',
            avatar: userData.profilePicture || '/resources/default-profile.png'
          };

          this.privacySettings = {
            keepProfilePrivate: userData.isProfilePrivate ?? false,
            keepPostPrivate: userData.isPostPrivate ?? false
          };
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        console.warn("Current user data is not loaded yet.");
        this.$router.push('/login');
      }
    },

    async updateUserProfilePicture(imageUrl) {
      try {
        const token = await getToken();
        await axios.put(
          `http://localhost:3001/api/users/update/profilePicture/${this.currentUserId}`,
          { profilePicture: imageUrl },
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        this.userProfile.avatar = imageUrl;
      } catch (error) {
        console.error('Error updating profile picture URL:', error);
        this.photoAlert.type = 'danger';
        this.photoAlert.message = 'Error updating profile picture URL.';
        this.photoAlert.show = true;
        setTimeout(() => {
          this.photoAlert.show = false;
        }, 3000);
      }
    }
  },
  mounted() {
    this.initUserData();
    this.$nextTick(() => {
      this.initTooltips();
    });
  },
  updated() {
    this.$nextTick(() => {
      this.initTooltips();
    });
  },
  beforeUnmount() {
    this.destroyTooltips();
    clearTimeout(this.tooltipInitTimeout);
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