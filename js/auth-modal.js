(function(){
  // Simple Auth Modal for unified login/register flow
  const MODAL_ID = 'utp-auth-modal';

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    const wrapper = document.createElement('div');
    wrapper.id = MODAL_ID;
    wrapper.className = 'utp-auth-modal hidden';
    wrapper.innerHTML = `
      <div class="utp-auth-backdrop" data-close="1"></div>
      <div class="utp-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="utp-auth-title">
        <button class="utp-auth-close" aria-label="Close" data-close="1">×</button>
        <div class="utp-auth-header">
          <div class="utp-auth-brand"><i class="fas fa-lightbulb"></i></div>
          <h3 id="utp-auth-title">Welcome to Unlocking True Potential</h3>
          <p class="utp-auth-sub">Sign up to start your journey with us</p>
        </div>
        <div class="utp-auth-body">
          <button id="utp-google-btn" class="utp-btn utp-btn-google"><i class="fab fa-google"></i> Continue with Google</button>
          <div class="utp-auth-sep"><span>Or</span></div>
          <form id="utp-auth-form">
            <div class="utp-input">
              <i class="fas fa-envelope"></i>
              <input id="utp-email" type="email" placeholder="Enter your email" autocomplete="email" required />
            </div>
            <div class="utp-input">
              <i class="fas fa-lock"></i>
              <input id="utp-password" type="password" placeholder="Enter password" autocomplete="current-password" required />
              <button type="button" class="utp-eye" aria-label="Toggle password" id="utp-toggle-pass"><i class="far fa-eye"></i></button>
            </div>
            <div class="utp-auth-row">
              <a href="#" id="utp-forgot" class="utp-link">Forgot Password?</a>
            </div>
            <button type="submit" class="utp-btn utp-btn-primary" id="utp-auth-submit">Login</button>
          </form>
          <div class="utp-auth-alt">Don’t have an account? <a href="#" id="utp-to-register" class="utp-link">Register</a></div>
        </div>
      </div>`;
    document.body.appendChild(wrapper);

    // Events
    wrapper.addEventListener('click', (e)=>{
      if (e.target.dataset.close) closeAuthModal();
    });
    wrapper.querySelector('#utp-toggle-pass').addEventListener('click', ()=>{
      const inp = wrapper.querySelector('#utp-password');
      const icon = wrapper.querySelector('#utp-toggle-pass i');
      if (inp.type === 'password') { inp.type = 'text'; icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
      else { inp.type = 'password'; icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
    });

    // Mode
    let mode = 'login'; // or 'register'
    const submitBtn = wrapper.querySelector('#utp-auth-submit');
    const subText = wrapper.querySelector('.utp-auth-sub');
    const title = wrapper.querySelector('#utp-auth-title');

    wrapper.querySelector('#utp-to-register').addEventListener('click', (e)=>{
      e.preventDefault();
      if (mode === 'login') {
        mode = 'register';
        submitBtn.textContent = 'Create Account';
        subText.textContent = 'Create your account to begin your journey';
        title.textContent = 'Create your UTP Account';
        wrapper.querySelector('.utp-auth-alt').innerHTML = "Already have an account? <a href='#' id='utp-to-login' class='utp-link'>Login</a>";
      }
      attachAltSwitch();
    });
    function attachAltSwitch(){
      const toLogin = wrapper.querySelector('#utp-to-login');
      if (toLogin) {
        toLogin.addEventListener('click', (e)=>{
          e.preventDefault();
          mode = 'login';
          submitBtn.textContent = 'Login';
          subText.textContent = 'Sign up to start your journey with us';
          title.textContent = 'Welcome to Unlocking True Potential';
          wrapper.querySelector('.utp-auth-alt').innerHTML = "Don’t have an account? <a href='#' id='utp-to-register' class='utp-link'>Register</a>";
          // re-bind register link
          wrapper.querySelector('#utp-to-register').addEventListener('click', (e)=>{
            e.preventDefault();
            mode = 'register';
            submitBtn.textContent = 'Create Account';
            subText.textContent = 'Create your account to begin your journey';
            title.textContent = 'Create your UTP Account';
            wrapper.querySelector('.utp-auth-alt').innerHTML = "Already have an account? <a href='#' id='utp-to-login' class='utp-link'>Login</a>";
            attachAltSwitch();
          });
        });
      }
    }

    // Google button
    wrapper.querySelector('#utp-google-btn').addEventListener('click', async ()=>{
      try {
        await ensureFirebase();
        const user = await (window.FirebaseService?.signInWithGoogle?.());
        // Heuristic: if first sign-in time equals last sign-in time, it's likely a brand new user
        const meta = user?.user?.metadata || user?.metadata || {};
        const isNewUser = !!(user?.additionalUserInfo?.isNewUser || (meta.creationTime && meta.creationTime === meta.lastSignInTime));
        await postAuthRoute(user?.user || user, { isNewUser });
      } catch (e) {
        notify('Google sign-in failed: ' + (e.message||e), 'error');
      }
    });

    // Forgot password
    wrapper.querySelector('#utp-forgot').addEventListener('click', async (e)=>{
      e.preventDefault();
      try {
        const email = wrapper.querySelector('#utp-email').value.trim();
        if (!email) { notify('Enter your email to reset password.', 'warning'); return; }
        await ensureFirebase();
        if (window.FirebaseService.resetPassword) {
          await window.FirebaseService.resetPassword(email);
        } else if (window.firebase?.auth) {
          await window.firebase.auth().sendPasswordResetEmail(email);
        }
        notify('Password reset email sent.', 'success');
      } catch (err) {
        notify('Could not send reset email: ' + (err.message||err), 'error');
      }
    });

    // Email/password submit
    wrapper.querySelector('#utp-auth-form').addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = wrapper.querySelector('#utp-email').value.trim();
      const pass = wrapper.querySelector('#utp-password').value;
      try {
        await ensureFirebase();
        let userCred;
        if (mode === 'register') {
          if (window.FirebaseService.createUserWithEmail) {
            userCred = await window.FirebaseService.createUserWithEmail(email, pass);
          } else {
            userCred = await firebase.auth().createUserWithEmailAndPassword(email, pass);
          }
          await postAuthRoute(userCred?.user || userCred, { isNewUser: true });
          return;
        } else {
          if (window.FirebaseService.signInWithEmail) {
            userCred = await window.FirebaseService.signInWithEmail(email, pass);
          } else {
            userCred = await firebase.auth().signInWithEmailAndPassword(email, pass);
          }
        }
        await postAuthRoute(userCred?.user || userCred, { isNewUser: false });
      } catch (err) {
        notify(err.message || 'Authentication failed', 'error');
      }
    });
  }

  async function postAuthRoute(user, opts = {}) {
    try {
      // Persist minimal user data locally so downstream pages can read it
      if (window.UTPApp && user) {
        const cached = window.UTPApp.getUserData?.() || {};
        const userData = {
          ...cached,
          uid: user.uid || user.id,
          id: user.uid || user.id,
          email: user.email || cached.email,
          displayName: user.displayName || cached.displayName,
        };
        window.UTPApp.saveUserData?.(userData);
      }

      await ensureFirebase();
      let profile = null;
      try {
        if (user?.uid && window.FirebaseService?.getUserProfile) {
          profile = await window.FirebaseService.getUserProfile(user.uid);
        } else if (user?.uid && window.FirebaseService?.getUser) {
          profile = await window.FirebaseService.getUser(user.uid);
        }
      } catch (fetchErr) {
        console.warn('Could not fetch profile from backend, will decide based on local flags', fetchErr);
      }

      // Decide route
      const local = window.UTPApp?.getUserData?.() || {};
      const isProfileComplete = !!(local.profileCompleted || (profile && (profile.profileCompleted || profile.name || profile.firstName || profile.lastName)));
      // If we received a profile, persist it locally to stabilize future checks
      if (profile && window.UTPApp?.saveUserData) {
        const merged = { ...(window.UTPApp.getUserData?.() || {}), profile, profileCompleted: true };
        window.UTPApp.saveUserData(merged);
      }
      const isNew = opts.isNewUser;

      // If we definitively know user is NOT new, send to dashboard regardless of profile doc noise
      if (isNew === false) {
        notify('Welcome back! Redirecting to dashboard...', 'success');
        setTimeout(()=> window.location.href = 'pages/dashboard.html', 500);
        return;
      }

      // If we definitively know user IS new, guide to profile setup
      if (isNew === true) {
        notify('Let’s complete your profile.', 'info');
        setTimeout(()=> window.location.href = 'pages/profile-setup.html', 500);
        return;
      }

      // Fallback: infer from profile completeness
      if (isProfileComplete) {
        notify('Welcome back! Redirecting to dashboard...', 'success');
        setTimeout(()=> window.location.href = 'pages/dashboard.html', 500);
      } else {
        notify('Let’s complete your profile.', 'info');
        setTimeout(()=> window.location.href = 'pages/profile-setup.html', 500);
      }
    } catch (e) {
      console.warn('postAuthRoute error', e);
      // Safer default for brand-new users is to complete profile first
      window.location.href = 'pages/profile-setup.html';
    } finally {
      closeAuthModal();
    }
  }

  async function ensureFirebase(){
    if (window.FirebaseService && window.FirebaseService.initialize) {
      await window.FirebaseService.initialize();
    }
  }

  function notify(msg, type){
    if (window.UTPApp?.showNotification) return window.UTPApp.showNotification(msg, type||'info');
    console.log('[AuthModal]', type||'info', msg);
  }

  function openAuthModal(){
    ensureModal();
    document.getElementById(MODAL_ID).classList.remove('hidden');
  }
  function closeAuthModal(){
    const m = document.getElementById(MODAL_ID);
    if (m) m.classList.add('hidden');
  }

  // Expose
  window.openAuthModal = openAuthModal;
})();

// Optional: toggle nav login button visibility based on auth state
document.addEventListener('DOMContentLoaded', async () => {
  const toggleButtons = (show) => {
    document.querySelectorAll('#nav-login-btn').forEach(btn => {
      if (btn) btn.style.display = show ? 'inline-flex' : 'none';
    });
  };
  try {
    if (window.FirebaseService && window.FirebaseService.initialize) {
      await window.FirebaseService.initialize();
      const auth = window.FirebaseService.auth && window.FirebaseService.auth();
      if (auth) {
        toggleButtons(!auth.currentUser);
        auth.onAuthStateChanged((u) => toggleButtons(!u));
        return;
      }
    }
  } catch (e) {
    // Non-blocking
  }
  // Fallback: show button
  toggleButtons(true);
});
