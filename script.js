function showGetStartedScreen() {
  document.body.innerHTML = `
    <div class="login-container">
      <div class="video-wrap">
        <video id="bgVideo" class="bg-video" autoplay muted playsinline loop>
          <source src="Valorant Background.mp4" type="video/mp4">
        </video>
      </div>
      <form class="login-form signup-form-compact" onsubmit="return false;">
        <h2>Sign Up</h2>
        <input id="username" type="text" placeholder="Username" class="login-input" required>
        <input id="email" type="email" placeholder="Email" class="login-input" required>
        <input id="password" type="password" placeholder="Password" class="login-input" required>
  <div id="pwdHint" class="pwd-hint invalid"><span class="pwd-star" aria-hidden="true">*</span><span class="pwd-text">At least 8 characters</span></div>
        <div id="authMsg" class="auth-msg" aria-live="polite" style="margin-top:10px;color:#ff6b6b"></div>
        <button id="signupBtn" type="button" class="signup-btn">Sign Up</button>
        <div class="alt-action">
          <label class="alt-label">Already have an Account?</label>
          <button id="loginBtn" type="button" class="secondary-btn">Log in</button>
        </div>
      </form>
    </div>
  `;

  var password = document.getElementById('password');
  var hint = document.getElementById('pwdHint');
  var loginBtn = document.getElementById('loginBtn');
  var signupBtn = document.getElementById('signupBtn');
  var email = document.getElementById('email');
  var username = document.getElementById('username');
  var authMsg = document.getElementById('authMsg');

  function updateHint() {
    if (password.value.length >= 8) {
      hint.classList.remove('invalid');
      hint.classList.add('valid');
    } else {
      hint.classList.remove('valid');
      hint.classList.add('invalid');
    }
    if (password.value.length > 0) {
      hint.classList.add('show-star');
    } else {
      hint.classList.remove('show-star');
    }
  }

  password.addEventListener('input', updateHint);

  // submit on Enter for sign-up fields
  function signupOnEnter(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      signupBtn.click();
    }
  }
  username.addEventListener('keydown', signupOnEnter);
  email.addEventListener('keydown', signupOnEnter);
  password.addEventListener('keydown', signupOnEnter);

  // Open the login screen when user picks "Log in"
  loginBtn.addEventListener('click', function() {
    showLoginScreen();
  });

  // Sign up flow using Firebase helpers exposed on window
  signupBtn.addEventListener('click', function() {
    updateHint();
    if (authMsg) {
      authMsg.textContent = '';
      authMsg.style.display = 'none';
    }
    if (username.value && email.value && password.value.length >= 8) {
      if (!window.createUser) {
        if (authMsg) {
          authMsg.style.display = '';
          authMsg.textContent = 'Authentication not initialized.';
        }
        return;
      }
      // capture values then clear inputs immediately per request
      var _username = username.value.trim();
      var _email = email.value.trim();
      var _pwd = password.value;
      username.value = '';
      email.value = '';
      password.value = '';
      updateHint();
      signupBtn.disabled = true;
      window.createUser(_email, _pwd)
        .then(function(userCred) {
          signupBtn.disabled = false;
          // Save username to localStorage
          try {
            localStorage.setItem('spikecoach_username', _username);
          } catch (e) {
            console.error('Failed to save username:', e);
          }
          // Clear any error messages immediately on success
          if (authMsg) {
            authMsg.textContent = '';
            authMsg.style.display = 'none';
          }
          // ensure signed in: try signInUser if available, otherwise rely on auth state change
          if (window.signInUser) {
            return window.signInUser(_email, _pwd).then(function() { 
              // Clear message again before transitioning
              if (authMsg) {
                authMsg.textContent = '';
                authMsg.style.display = 'none';
              }
              showLoggedInScreen(); 
            }).catch(function(signInErr) {
              // If signIn fails, show error but this shouldn't happen normally
              signupBtn.disabled = false;
              if (authMsg) {
                authMsg.style.display = '';
                authMsg.textContent = signInErr.message || 'Sign in failed';
              }
            });
          }
          // fallback: show logged-in UI
          // Clear message before transitioning
          if (authMsg) {
            authMsg.textContent = '';
            authMsg.style.display = 'none';
          }
          showLoggedInScreen();
        })
        .catch(function(err) {
          // log raw error for debugging
          console.error('Sign up error:', err);
          var code = (err && err.code) || '';
          var msg = (err && err.message) || '';

          // If the account already exists (or an invalid-credential variant),
          // attempt to sign in with the provided credentials so the Sign Up button
          // doubles as a Log In when appropriate.
          var shouldTrySignIn = (
            code === 'auth/email-already-in-use' ||
            msg.indexOf('email-already-in-use') !== -1 ||
            code === 'auth/invalid-credential' ||
            msg.indexOf('invalid-credential') !== -1 ||
            msg.indexOf('invalid credential') !== -1
          );

          if (shouldTrySignIn && window.signInUser) {
            if (authMsg) {
              authMsg.style.display = '';
              authMsg.textContent = 'Account exists — attempting to sign in...';
            }
            // keep the button disabled while we try to sign in
            signupBtn.disabled = true;
            return window.signInUser(_email, _pwd)
              .then(function() {
                signupBtn.disabled = false;
                // Clear message before transitioning
                if (authMsg) {
                  authMsg.textContent = '';
                  authMsg.style.display = 'none';
                }
                showLoggedInScreen();
              })
              .catch(function(signInErr) {
                signupBtn.disabled = false;
                console.error('Sign in after signup attempt failed:', signInErr);
                var sCode = (signInErr && signInErr.code) || '';
                var sMsg = (signInErr && signInErr.message) || '';
                if (authMsg) {
                  authMsg.style.display = '';
                  if (sCode === 'auth/wrong-password' || sCode === 'auth/user-not-found' || sMsg.indexOf('wrong-password') !== -1 || sMsg.indexOf('user-not-found') !== -1) {
                    authMsg.textContent = 'Incorrect Email or Password';
                  } else {
                    authMsg.textContent = signInErr.message || 'Sign in failed';
                  }
                }
              });
          }

          // If we didn't attempt sign-in, map common createUser errors to friendly messages
          signupBtn.disabled = false;
          if (authMsg) {
            authMsg.style.display = '';
            if (code === 'auth/email-already-in-use' || msg.indexOf('email-already-in-use') !== -1) {
              authMsg.textContent = 'Email already in use';
            } else if (code === 'auth/weak-password' || msg.indexOf('weak-password') !== -1) {
              authMsg.textContent = 'Password is too weak';
            } else if (code === 'auth/invalid-email' || msg.indexOf('invalid-email') !== -1 || msg.indexOf('invalid email') !== -1) {
              authMsg.textContent = 'Invalid Email';
            } else if (code === 'auth/invalid-credential' || msg.indexOf('invalid-credential') !== -1 || msg.indexOf('invalid credential') !== -1) {
              authMsg.textContent = 'Incorrect Email or Password';
            } else {
              authMsg.textContent = err.message || 'Sign up failed';
            }
          }
        });
    } else {
      if (authMsg) {
        authMsg.style.display = '';
        if (!username.value) {
          authMsg.textContent = 'Please enter a username.';
        } else {
          authMsg.textContent = 'Please enter a valid email and a password with at least 8 characters.';
        }
      }
    }
  });
  if (window.gsap) {
    animateLoginElements();
  }
}

function showLoginScreen() {
  document.body.innerHTML = `
    <div class="login-container">
      <div class="video-wrap">
        <video id="bgVideo" class="bg-video" autoplay muted playsinline loop>
          <source src="Valorant Background.mp4" type="video/mp4">
        </video>
      </div>
      <form class="login-form" onsubmit="return false;">
        <h2>Log In</h2>
        <input id="emailL" type="email" placeholder="Email" class="login-input" required>
        <input id="passwordL" type="password" placeholder="Password" class="login-input" required>
        <div id="authMsgL" class="auth-msg" aria-live="polite" style="margin-top:10px;color:#ff6b6b"></div>
  <button id="signinBtn" type="button" class="signup-btn">Log in</button>
        <div class="alt-action">
          <label class="alt-label">Don't have an account?</label>
          <button id="backToSignup" type="button" class="secondary-btn">Sign Up</button>
        </div>
      </form>
    </div>
  `;

  var signinBtn = document.getElementById('signinBtn');
  var backTo = document.getElementById('backToSignup');
  var emailL = document.getElementById('emailL');
  var passwordL = document.getElementById('passwordL');
  var authMsgL = document.getElementById('authMsgL');

  signinBtn.addEventListener('click', function() {
    if (authMsgL) {
      authMsgL.textContent = '';
      authMsgL.style.display = 'none';
    }
    if (emailL.value && passwordL.value) {
      if (!window.signInUser) {
        if (authMsgL) {
          authMsgL.style.display = '';
          authMsgL.textContent = 'Authentication not initialized.';
        }
        return;
      }
      // capture then clear
      var _emailL = emailL.value.trim();
      var _pwdL = passwordL.value;
      emailL.value = '';
      passwordL.value = '';
      signinBtn.disabled = true;
      window.signInUser(_emailL, _pwdL)
        .then(function() {
          signinBtn.disabled = false;
          // Clear message before transitioning
          if (authMsgL) {
            authMsgL.textContent = '';
            authMsgL.style.display = 'none';
          }
          showLoggedInScreen();
        })
        .catch(function(err) {
          signinBtn.disabled = false;
          // log raw error for debugging
          console.error('Sign in error:', err);
          var code = (err && err.code) || '';
          var msg = (err && err.message) || '';
          // map a set of auth failure codes/messages to a single friendly message
          if (authMsgL) {
            authMsgL.style.display = '';
            if (
              code === 'auth/wrong-password' ||
              code === 'auth/user-not-found' ||
              code === 'auth/invalid-email' ||
              code === 'auth/invalid-credential' ||
              code === 'auth/invalid-credentials' ||
              msg.indexOf('wrong-password') !== -1 ||
              msg.indexOf('user-not-found') !== -1 ||
              msg.indexOf('invalid-email') !== -1 ||
              msg.indexOf('invalid-credential') !== -1 ||
              msg.indexOf('invalid credential') !== -1
            ) {
              authMsgL.textContent = 'Incorrect Email or Password';
            } else {
              // fallback: show raw message if available, but keep raw error visible in console
              authMsgL.textContent = err.message || 'Sign in failed';
            }
          }
        });
    } else {
      if (authMsgL) {
        authMsgL.style.display = '';
        authMsgL.textContent = 'Please enter your email and password.';
      }
    }
  });

  // submit on Enter for login fields
  function loginOnEnter(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      signinBtn.click();
    }
  }
  emailL.addEventListener('keydown', loginOnEnter);
  passwordL.addEventListener('keydown', loginOnEnter);

  backTo.addEventListener('click', function() {
    showGetStartedScreen();
  });

  if (window.gsap) animateLoginElements();
}

function showLoggedInScreen() {
  showWelcomeAnimation();
}

function showWelcomeAnimation() {
  document.body.innerHTML = `
    <div class="welcome-container">
      <h1 id="welcomeText" class="welcome-text"></h1>
    </div>
  `;
  
  var welcomeText = document.getElementById('welcomeText');
  var text = "Welcome";
  var index = 0;
  
  if (window.gsap && welcomeText) {
    // Typewriter effect
    function typeChar() {
      if (index < text.length) {
        welcomeText.textContent += text.charAt(index);
        index++;
        setTimeout(typeChar, 150); // Speed of typing
      } else {
        // After typing is complete, wait a moment, then animate off screen and show onboarding
        setTimeout(function() {
          var tl = gsap.timeline({
            onComplete: function() {
              showOnboarding(1);
            }
          });
          
          // Animate off screen (move up and fade out)
          tl.to('#welcomeText', {
            duration: 0.6,
            y: -100,
            opacity: 0,
            ease: 'power2.in'
          });
        }, 800); // Brief pause after typing completes
      }
    }
    
    // Start with text invisible and centered
    gsap.set('#welcomeText', {
      opacity: 1,
      y: 0
    });
    
    // Start typing animation
    typeChar();
  } else {
    // Fallback if GSAP is not available
    welcomeText.textContent = text;
    setTimeout(function() {
      showOnboarding(1);
    }, 2000);
  }
}

function showOnboarding(page) {
  var page1Content = `
    <h2 class="onboarding-title">Connect your Valorant Account</h2>
    <p class="onboarding-subtitle">Connecting your account will allow you to view historical analysis</p>
    <div class="onboarding-image-placeholder"></div>
    <button class="onboarding-btn">Connect Your Account</button>
  `;
  
  var page2Content = `
    <h2 class="onboarding-title">Watch a Tutorial</h2>
    <p class="onboarding-subtitle">Learn how to use SpikeCoach to its fullest extent</p>
    <div class="onboarding-image-placeholder"></div>
    <button class="onboarding-btn">Go to Tutorial</button>
  `;
  
  var page3Content = `
    <h2 class="onboarding-title">You're All Set!</h2>
    <p class="onboarding-subtitle">Get started with SpikeCoach now</p>
    <div class="onboarding-image-placeholder"></div>
    <button class="onboarding-btn" id="letsGoBtn">Let's Go</button>
  `;
  
  var content = page === 1 ? page1Content : (page === 2 ? page2Content : page3Content);
  
  document.body.innerHTML = `
    <div class="onboarding-container">
      <div class="onboarding-card">
        ${content}
        ${page > 1 ? '<div class="onboarding-arrow onboarding-arrow-left" id="prevBtn">&#8249;</div>' : ''}
        ${page < 3 ? '<div class="onboarding-arrow onboarding-arrow-right" id="nextBtn">&#8250;</div>' : ''}
      </div>
    </div>
  `;
  
  var nextBtn = document.getElementById('nextBtn');
  var prevBtn = document.getElementById('prevBtn');
  var letsGoBtn = document.getElementById('letsGoBtn');
  
  if (nextBtn) {
    nextBtn.addEventListener('click', function() {
      showOnboarding(page + 1);
    });
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', function() {
      showOnboarding(page - 1);
    });
  }
  
  if (letsGoBtn) {
    letsGoBtn.addEventListener('click', function() {
      showMainApp();
    });
  }
  
  if (window.gsap) {
    animateOnboarding();
  }
}

function showMainApp() {
  var userEmail = '';
  var userInitial = 'U';
  var userName = 'TestUser';
  
  try {
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
      userEmail = window.firebaseAuth.currentUser.email || '';
      if (userEmail && userEmail.length > 0) {
        userInitial = userEmail.charAt(0).toUpperCase();
      }
    }
    // Retrieve username from localStorage
    var storedUsername = localStorage.getItem('spikecoach_username');
    if (storedUsername) {
      userName = storedUsername;
      userInitial = userName.charAt(0).toUpperCase();
    }
  } catch (e) {}
  
  document.body.innerHTML = `
    <div class="products-screen">
      <nav class="top-navbar">
        <div class="navbar-logo" id="navbarLogo">
          <img src="spikecoach_emblem.png" alt="SpikeCoach" class="navbar-logo-img">
        </div>
        <div class="navbar-center">
          <ul class="taskbar-nav">
            <li class="taskbar-item" data-section="lineups">
              <span class="taskbar-text">Line-ups</span>
            </li>
            <li class="taskbar-item" data-section="past-games">
              <span class="taskbar-text">Past Games</span>
            </li>
            <li class="taskbar-item" data-section="strategy">
              <span class="taskbar-text">Strategy</span>
            </li>
            <li class="taskbar-item" data-section="analyze">
              <span class="taskbar-text">Analyze</span>
            </li>
            <li class="taskbar-item" data-section="ai-coach">
              <span class="taskbar-text">AI Coach</span>
            </li>
            <li class="taskbar-item" data-section="guess-rank">
              <span class="taskbar-text">Guess the Rank</span>
            </li>
          </ul>
        </div>
        <div class="navbar-right">
          <div class="profile-container" id="profileContainer">
            <div class="profile-circle" id="mainProfileCircle">${userInitial}</div>
            <div class="profile-arrow" id="profileArrow">▼</div>
          </div>
          <div class="profile-dropdown" id="profileDropdown">
            <div class="dropdown-user-info">
              <div class="dropdown-username">${userName}</div>
              <div class="dropdown-email">${userEmail || 'user@example.com'}</div>
            </div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-row">Profile</div>
            <div class="dropdown-row">Settings</div>
            <div class="dropdown-row">Tutorial</div>
            <div class="dropdown-row">Help</div>
            <div class="dropdown-row" id="signoutRow">Sign out</div>
          </div>
        </div>
      </nav>
      <div class="products-content" id="mainContent">
        <div class="welcome-section active" id="welcomeSection">
          <h1 class="welcome-title">Welcome to SpikeCoach</h1>
          <p class="welcome-subtitle">${userEmail ? 'Signed in as ' + userEmail : 'You are now logged in.'}</p>
          <button class="spikecoach-tab-btn" id="spikecoachTabBtn">Open SpikeCoach Tab</button>
        </div>
        <div class="whats-new-section" id="whatsNewSection">
          <h1 class="whats-new-title">What's New</h1>
          <p class="whats-new-subtitle">Latest updates and features</p>
        </div>
        <div class="blank-section" id="lineupsSection">
          <div class="agent-select-container">
            <h2 class="agent-select-title lineups-title">Select Agent</h2>
            <div class="agents-grid" id="agentsGrid">
              <div class="agent-card" data-agent="Astra">
                <img src="Agent_Icons/Astra_icon.webp" alt="Astra" class="agent-icon">
                <span class="agent-name">Astra</span>
              </div>
              <div class="agent-card" data-agent="Breach">
                <img src="Agent_Icons/Breach_icon.webp" alt="Breach" class="agent-icon">
                <span class="agent-name">Breach</span>
              </div>
              <div class="agent-card" data-agent="Brimstone">
                <img src="Agent_Icons/Brimstone_icon.webp" alt="Brimstone" class="agent-icon">
                <span class="agent-name">Brimstone</span>
              </div>
              <div class="agent-card" data-agent="Chamber">
                <img src="Agent_Icons/Chamber_icon.webp" alt="Chamber" class="agent-icon">
                <span class="agent-name">Chamber</span>
              </div>
              <div class="agent-card" data-agent="Clove">
                <img src="Agent_Icons/Clove_icon.webp" alt="Clove" class="agent-icon">
                <span class="agent-name">Clove</span>
              </div>
              <div class="agent-card" data-agent="Cypher">
                <img src="Agent_Icons/Cypher_icon.webp" alt="Cypher" class="agent-icon">
                <span class="agent-name">Cypher</span>
              </div>
              <div class="agent-card" data-agent="Deadlock">
                <img src="Agent_Icons/Deadlock_icon.webp" alt="Deadlock" class="agent-icon">
                <span class="agent-name">Deadlock</span>
              </div>
              <div class="agent-card" data-agent="Fade">
                <img src="Agent_Icons/Fade_icon.webp" alt="Fade" class="agent-icon">
                <span class="agent-name">Fade</span>
              </div>
              <div class="agent-card" data-agent="Gekko">
                <img src="Agent_Icons/Gekko_icon.webp" alt="Gekko" class="agent-icon">
                <span class="agent-name">Gekko</span>
              </div>
              <div class="agent-card" data-agent="Harbor">
                <img src="Agent_Icons/Harbor_icon.webp" alt="Harbor" class="agent-icon">
                <span class="agent-name">Harbor</span>
              </div>
              <div class="agent-card" data-agent="Iso">
                <img src="Agent_Icons/Iso_icon.webp" alt="Iso" class="agent-icon">
                <span class="agent-name">Iso</span>
              </div>
              <div class="agent-card" data-agent="Jett">
                <img src="Agent_Icons/Jett_icon.webp" alt="Jett" class="agent-icon">
                <span class="agent-name">Jett</span>
              </div>
              <div class="agent-card" data-agent="KAYO">
                <img src="Agent_Icons/KAYO_icon.webp" alt="KAY/O" class="agent-icon">
                <span class="agent-name">KAY/O</span>
              </div>
              <div class="agent-card" data-agent="Killjoy">
                <img src="Agent_Icons/Killjoy_icon.webp" alt="Killjoy" class="agent-icon">
                <span class="agent-name">Killjoy</span>
              </div>
              <div class="agent-card" data-agent="Neon">
                <img src="Agent_Icons/Neon_icon.webp" alt="Neon" class="agent-icon">
                <span class="agent-name">Neon</span>
              </div>
              <div class="agent-card" data-agent="Omen">
                <img src="Agent_Icons/Omen_icon.webp" alt="Omen" class="agent-icon">
                <span class="agent-name">Omen</span>
              </div>
              <div class="agent-card" data-agent="Phoenix">
                <img src="Agent_Icons/Phoenix_icon.webp" alt="Phoenix" class="agent-icon">
                <span class="agent-name">Phoenix</span>
              </div>
              <div class="agent-card" data-agent="Raze">
                <img src="Agent_Icons/Raze_icon.webp" alt="Raze" class="agent-icon">
                <span class="agent-name">Raze</span>
              </div>
              <div class="agent-card" data-agent="Reyna">
                <img src="Agent_Icons/Reyna_icon.webp" alt="Reyna" class="agent-icon">
                <span class="agent-name">Reyna</span>
              </div>
              <div class="agent-card" data-agent="Sage">
                <img src="Agent_Icons/Sage_icon.webp" alt="Sage" class="agent-icon">
                <span class="agent-name">Sage</span>
              </div>
              <div class="agent-card" data-agent="Skye">
                <img src="Agent_Icons/Skye_icon.webp" alt="Skye" class="agent-icon">
                <span class="agent-name">Skye</span>
              </div>
              <div class="agent-card" data-agent="Sova">
                <img src="Agent_Icons/Sova_icon.webp" alt="Sova" class="agent-icon">
                <span class="agent-name">Sova</span>
              </div>
              <div class="agent-card" data-agent="Tejo">
                <img src="Agent_Icons/Tejo_icon.webp" alt="Tejo" class="agent-icon">
                <span class="agent-name">Tejo</span>
              </div>
              <div class="agent-card" data-agent="Veto">
                <img src="Agent_Icons/Veto_icon.webp" alt="Veto" class="agent-icon">
                <span class="agent-name">Veto</span>
              </div>
              <div class="agent-card" data-agent="Viper">
                <img src="Agent_Icons/Viper_icon.webp" alt="Viper" class="agent-icon">
                <span class="agent-name">Viper</span>
              </div>
              <div class="agent-card" data-agent="Vyse">
                <img src="Agent_Icons/Vyse_icon.webp" alt="Vyse" class="agent-icon">
                <span class="agent-name">Vyse</span>
              </div>
              <div class="agent-card" data-agent="Waylay">
                <img src="Agent_Icons/Waylay_icon.webp" alt="Waylay" class="agent-icon">
                <span class="agent-name">Waylay</span>
              </div>
              <div class="agent-card" data-agent="Yoru">
                <img src="Agent_Icons/Yoru_icon.webp" alt="Yoru" class="agent-icon">
                <span class="agent-name">Yoru</span>
              </div>
            </div>
          </div>
        </div>
        <div class="blank-section" id="mapDetailSection">
          <div class="lineups-container lineups-map-picker">
            <button class="back-button" id="backToAgentsBtn">← Back to Agents</button>
            <p class="lineups-future-note">More line-ups will be added in future updates, along with possible user sharing features.</p>
            <h2 class="lineups-title">Select your map</h2>
            <div class="maps-grid" id="mapsGrid">
              <div class="map-card" data-map="Abyss">
                <img src="Map_Loading/Loading_Screen_Abyss.webp" alt="Abyss" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Abyss</span>
                </div>
              </div>
              <div class="map-card" data-map="Ascent">
                <img src="Map_Loading/Loading_Screen_Ascent.webp" alt="Ascent" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Ascent</span>
                </div>
              </div>
              <div class="map-card" data-map="Bind">
                <img src="Map_Loading/Loading_Screen_Bind.webp" alt="Bind" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Bind</span>
                </div>
              </div>
              <div class="map-card" data-map="Breeze">
                <img src="Map_Loading/Loading_Screen_Breeze.webp" alt="Breeze" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Breeze</span>
                </div>
              </div>
              <div class="map-card" data-map="Corrode">
                <img src="Map_Loading/Loading_Screen_Corrode.webp" alt="Corrode" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Corrode</span>
                </div>
              </div>
              <div class="map-card" data-map="Fracture">
                <img src="Map_Loading/Loading_Screen_Fracture.webp" alt="Fracture" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Fracture</span>
                </div>
              </div>
              <div class="map-card" data-map="Haven">
                <img src="Map_Loading/Loading_Screen_Haven.webp" alt="Haven" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Haven</span>
                </div>
              </div>
              <div class="map-card" data-map="Icebox">
                <img src="Map_Loading/Loading_Screen_Icebox.webp" alt="Icebox" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Icebox</span>
                </div>
              </div>
              <div class="map-card" data-map="Lotus">
                <img src="Map_Loading/Loading_Screen_Lotus.webp" alt="Lotus" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Lotus</span>
                </div>
              </div>
              <div class="map-card" data-map="Pearl">
                <img src="Map_Loading/Loading_Screen_Pearl.webp" alt="Pearl" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Pearl</span>
                </div>
              </div>
              <div class="map-card" data-map="Split">
                <img src="Map_Loading/Loading_Screen_Split.webp" alt="Split" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Split</span>
                </div>
              </div>
              <div class="map-card" data-map="Summit">
                <img src="Map_Loading/Summit.jpg" alt="Summit" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Summit</span>
                </div>
              </div>
              <div class="map-card" data-map="Sunset">
                <img src="Map_Loading/Loading_Screen_Sunset.webp" alt="Sunset" class="map-image">
                <div class="map-overlay">
                  <span class="map-name">Sunset</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="blank-section" id="lineupDetailSection">
          <div class="lineup-detail-container">
            <button class="back-button" id="backToMapsBtn">← Back to Maps</button>
            <div class="lineup-detail-content">
              <h2 class="lineup-detail-title" id="selectedAgentTitle"></h2>
              <button class="post-lineup-btn" id="postLineupBtn">
                Post Your Own Lineup
              </button>
            </div>
          </div>
        </div>
        <div class="blank-section" id="pastGamesSection">
          <div class="past-games-container">
            <h2 class="past-games-title">Match History</h2>
            <div class="past-games-list" id="pastGamesList">
              <!-- Games will be dynamically inserted here -->
            </div>
          </div>
        </div>
        <div class="blank-section" id="strategySection">
          <div class="lineups-container strategy-maps-container">
            <div class="strategy-maps-header">
              <h2 class="lineups-title analyze-title">Strategy Planner</h2>
              <p class="analyze-subtitle strategy-maps-subtitle">Select a map to analyze</p>
            </div>
            <div class="maps-grid" id="analyzeMapsGrid">
              <div class="map-card" data-map="Abyss">
                <img src="Map_Loading/Loading_Screen_Abyss.webp" alt="Abyss" class="map-image">
                <div class="map-overlay"><span class="map-name">Abyss</span></div>
              </div>
              <div class="map-card" data-map="Ascent">
                <img src="Map_Loading/Loading_Screen_Ascent.webp" alt="Ascent" class="map-image">
                <div class="map-overlay"><span class="map-name">Ascent</span></div>
              </div>
              <div class="map-card" data-map="Bind">
                <img src="Map_Loading/Loading_Screen_Bind.webp" alt="Bind" class="map-image">
                <div class="map-overlay"><span class="map-name">Bind</span></div>
              </div>
              <div class="map-card" data-map="Breeze">
                <img src="Map_Loading/Loading_Screen_Breeze.webp" alt="Breeze" class="map-image">
                <div class="map-overlay"><span class="map-name">Breeze</span></div>
              </div>
              <div class="map-card" data-map="Corrode">
                <img src="Map_Loading/Loading_Screen_Corrode.webp" alt="Corrode" class="map-image">
                <div class="map-overlay"><span class="map-name">Corrode</span></div>
              </div>
              <div class="map-card" data-map="Fracture">
                <img src="Map_Loading/Loading_Screen_Fracture.webp" alt="Fracture" class="map-image">
                <div class="map-overlay"><span class="map-name">Fracture</span></div>
              </div>
              <div class="map-card" data-map="Haven">
                <img src="Map_Loading/Loading_Screen_Haven.webp" alt="Haven" class="map-image">
                <div class="map-overlay"><span class="map-name">Haven</span></div>
              </div>
              <div class="map-card" data-map="Icebox">
                <img src="Map_Loading/Loading_Screen_Icebox.webp" alt="Icebox" class="map-image">
                <div class="map-overlay"><span class="map-name">Icebox</span></div>
              </div>
              <div class="map-card" data-map="Lotus">
                <img src="Map_Loading/Loading_Screen_Lotus.webp" alt="Lotus" class="map-image">
                <div class="map-overlay"><span class="map-name">Lotus</span></div>
              </div>
              <div class="map-card" data-map="Pearl">
                <img src="Map_Loading/Loading_Screen_Pearl.webp" alt="Pearl" class="map-image">
                <div class="map-overlay"><span class="map-name">Pearl</span></div>
              </div>
              <div class="map-card" data-map="Split">
                <img src="Map_Loading/Loading_Screen_Split.webp" alt="Split" class="map-image">
                <div class="map-overlay"><span class="map-name">Split</span></div>
              </div>
              <div class="map-card" data-map="Summit">
                <img src="Map_Loading/Summit.jpg" alt="Summit" class="map-image">
                <div class="map-overlay"><span class="map-name">Summit</span></div>
              </div>
              <div class="map-card" data-map="Sunset">
                <img src="Map_Loading/Loading_Screen_Sunset.webp" alt="Sunset" class="map-image">
                <div class="map-overlay"><span class="map-name">Sunset</span></div>
              </div>
            </div>
          </div>
          <div class="analyze-minimap-view" id="analyzeMinimapView" style="display:none;">
            <button class="back-button" id="backToAnalyzeList">← Back to Maps</button>
            <h2 class="analyze-map-title" id="analyzeMapTitle"></h2>
            <div class="strategy-planner-layout">
              <aside class="strategy-team-panel strategy-team-panel--blue" id="strategyTeamBluePanel">
                <h3 class="strategy-team-heading">Blue Team</h3>
                <div class="strategy-team-slots" id="strategyBlueSlots" data-team="blue"></div>
              </aside>
              <div class="strategy-board">
                <div class="strategy-board-actions">
                  <button type="button" class="strategy-download-btn" id="strategyDownloadBtn">Download Strategy</button>
                </div>
                <div class="minimap-container strategy-minimap" id="strategyExportRoot">
                  <img src="" alt="Minimap" class="minimap-image" id="minimapImage">
                  <div class="strategy-map-layer" id="strategyMapLayer" aria-hidden="true">
                    <svg class="strategy-arrow-svg" id="strategyArrowSvg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
                    <div class="strategy-entities-layer" id="strategyEntitiesLayer"></div>
                  </div>
                </div>
              </div>
              <aside class="strategy-team-panel strategy-team-panel--red" id="strategyTeamRedPanel">
                <h3 class="strategy-team-heading">Red Team</h3>
                <div class="strategy-team-slots" id="strategyRedSlots" data-team="red"></div>
              </aside>
            </div>
            <div class="strategy-agent-picker" id="strategyAgentPicker" hidden>
              <div class="strategy-agent-picker-backdrop" id="strategyAgentPickerBackdrop"></div>
              <div class="strategy-agent-picker-dialog" role="dialog" aria-labelledby="strategyAgentPickerTitle">
                <div class="strategy-agent-picker-header">
                  <h4 id="strategyAgentPickerTitle">Select agent</h4>
                  <button type="button" class="strategy-agent-picker-close" id="strategyAgentPickerClose" aria-label="Close">×</button>
                </div>
                <button type="button" class="strategy-agent-remove-btn" id="strategyAgentRemoveBtn" hidden>Remove agent</button>
                <div class="strategy-agent-picker-grid" id="strategyAgentPickerGrid"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="blank-section" id="analyzeSection">
          <div class="analyze-coming-soon-wrap">
            <h2 class="analyze-title">Analyze</h2>
            <div class="analyze-coming-soon-block">
              <p class="analyze-coming-soon-heading"><span class="analyze-coming-soon-red">Coming soon</span></p>
              <p class="analyze-coming-soon-text">Learn from specific mistakes in your game and analyze what you could've done better.</p>
            </div>
          </div>
        </div>
        <div class="blank-section" id="aiCoachSection">
          <div class="ai-chat-container">
            <div class="ai-chat-header">
              <img src="Spikecoach_Final_Logo.png" alt="SpikeCoach" class="ai-chat-logo">
              <div class="ai-chat-header-text">
                <h2>AI Coach</h2>
                <p>Your personal Valorant strategist</p>
              </div>
            </div>
            <div class="ai-chat-messages" id="aiChatMessages">
              <div class="ai-welcome-message">
                <p>Hey! I'm your AI Coach. Ask me anything about Valorant - agents, maps, strategies, or how to improve your gameplay!</p>
              </div>
            </div>
            <div class="ai-chat-input-area">
              <input type="text" id="aiChatInput" placeholder="Ask me anything about Valorant..." maxlength="250">
              <button id="aiChatSend">Send</button>
            </div>
          </div>
        </div>
        <div class="blank-section" id="guessRankSection">
          <div class="guess-rank-container">
            <div class="guess-rank-header">
              <h2 class="guess-rank-title">Guess the Rank</h2>
              <p class="guess-rank-subtitle">Watch the clip and choose the player's rank.</p>
            </div>
            <div class="guess-rank-status">
              <div class="guess-score-card">
                <span class="guess-score-label">Score</span>
                <span class="guess-score-value" id="guessRankScore">0</span>
              </div>
              <div class="guess-score-card">
                <span class="guess-score-label">Correct</span>
                <span class="guess-score-value" id="guessRankCorrect">0</span>
              </div>
              <div class="guess-score-card">
                <span class="guess-score-label">Wrong</span>
                <span class="guess-score-value" id="guessRankWrong">0</span>
              </div>
            </div>
            <div class="guess-rank-middle-row">
              <div class="guess-video-placeholder" id="guessRankVideoPlaceholder">
                <span>Video Placeholder</span>
              </div>
              <div class="guess-rank-icons" id="guessRankBaseRanks">
                <button class="guess-rank-icon-card" data-rank="Iron" data-has-subranks="true"><img src="Rank_Icons/Iron_1_Rank.webp" alt="Iron"><span>Iron</span></button>
                <button class="guess-rank-icon-card" data-rank="Bronze" data-has-subranks="true"><img src="Rank_Icons/Bronze_1_Rank.webp" alt="Bronze"><span>Bronze</span></button>
                <button class="guess-rank-icon-card" data-rank="Silver" data-has-subranks="true"><img src="Rank_Icons/Silver_1_Rank.webp" alt="Silver"><span>Silver</span></button>
                <button class="guess-rank-icon-card" data-rank="Gold" data-has-subranks="true"><img src="Rank_Icons/Gold_1_Rank.webp" alt="Gold"><span>Gold</span></button>
                <button class="guess-rank-icon-card" data-rank="Platinum" data-has-subranks="true"><img src="Rank_Icons/Platinum_1_Rank.webp" alt="Platinum"><span>Platinum</span></button>
                <button class="guess-rank-icon-card" data-rank="Diamond" data-has-subranks="true"><img src="Rank_Icons/Diamond_1_Rank.webp" alt="Diamond"><span>Diamond</span></button>
                <button class="guess-rank-icon-card" data-rank="Ascendant" data-has-subranks="true"><img src="Rank_Icons/Ascendant_1_Rank.webp" alt="Ascendant"><span>Ascendant</span></button>
                <button class="guess-rank-icon-card" data-rank="Immortal" data-has-subranks="true"><img src="Rank_Icons/Immortal_1_Rank.webp" alt="Immortal"><span>Immortal</span></button>
                <button class="guess-rank-icon-card" data-rank="Radiant" data-has-subranks="false"><img src="Rank_Icons/Radiant_Rank.webp" alt="Radiant"><span>Radiant</span></button>
              </div>
            </div>
            <div class="guess-subrank-panel" id="guessSubrankPanel" aria-live="polite"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  var profileContainer = document.getElementById('profileContainer');
  var profileArrow = document.getElementById('profileArrow');
  var profileDropdown = document.getElementById('profileDropdown');
  var signoutRow = document.getElementById('signoutRow');
  
  if (profileContainer && profileArrow && profileDropdown) {
    profileContainer.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent this click from bubbling to document
      var isOpen = profileDropdown.classList.contains('open');
      if (isOpen) {
        profileDropdown.classList.remove('open');
        profileArrow.textContent = '▼';
      } else {
        profileDropdown.classList.add('open');
        profileArrow.textContent = '▲';
      }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      // Check if click is outside both the profile container and dropdown
      if (!profileContainer.contains(e.target) && !profileDropdown.contains(e.target)) {
        if (profileDropdown.classList.contains('open')) {
          profileDropdown.classList.remove('open');
          profileArrow.textContent = '▼';
        }
      }
    });
    
    // Prevent dropdown clicks from closing it
    profileDropdown.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  }
  
  if (signoutRow) {
    signoutRow.addEventListener('click', function() {
      if (window.signOutUser) {
        window.signOutUser().then(function() { showGoodbyeAnimation(); }).catch(function() { showGoodbyeAnimation(); });
      } else {
        showGoodbyeAnimation();
      }
    });
  }
  
  // Add click handler for Profile dropdown row
  var profileRows = document.querySelectorAll('.dropdown-row');
  if (profileRows.length > 0) {
    // Profile is the first dropdown row after the user info section
    profileRows[0].addEventListener('click', function() {
      showProfileOverlay();
    });
  }
  
  // Apply saved profile color
  var savedColor = localStorage.getItem('spikecoach_profile_color');
  if (savedColor) {
    applyProfileColor(savedColor);
  }
  
  // Section mapping
  var sectionMap = {
    'lineups': 'lineupsSection',
    'past-games': 'pastGamesSection',
    'strategy': 'strategySection',
    'analyze': 'analyzeSection',
    'ai-coach': 'aiCoachSection',
    'guess-rank': 'guessRankSection'
  };
  
  // Function to animate map cards within a section
  function animateMapCards(sectionId) {
    var section = document.getElementById(sectionId);
    if (!section) return;
    var mapCards = section.querySelectorAll('.map-card');
    mapCards.forEach(function(card, index) {
      card.classList.remove('animate-in');
      card.style.animationDelay = '';
      void card.offsetWidth;
      card.style.animationDelay = (index * 0.08) + 's';
      card.classList.add('animate-in');
    });
  }
  
  // Function to show a section
  function showSection(sectionId) {
    // Stop any playing agent audio
    if (agentAudio) {
      agentAudio.pause();
      agentAudio.currentTime = 0;
    }
    
    // Hide all sections
    var allSections = document.querySelectorAll('.blank-section, .whats-new-section, .welcome-section');
    allSections.forEach(function(s) { s.classList.remove('active'); });
    
    // Show the target section
    var targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
      
      if (sectionId === 'lineupsSection') {
        setTimeout(animateLineupsAgentCards, 50);
      } else if (sectionId === 'strategySection') {
        setTimeout(function() { animateMapCards(sectionId); }, 50);
      }
    }
  }
  
  // Logo click handler - show What's New
  var navbarLogo = document.getElementById('navbarLogo');
  if (navbarLogo) {
    navbarLogo.addEventListener('click', function() {
      // Stop any playing agent audio
      if (agentAudio) {
        agentAudio.pause();
        agentAudio.currentTime = 0;
      }
      
      // Remove active from all tabs
      var taskbarItems = document.querySelectorAll('.taskbar-item');
      taskbarItems.forEach(function(i) { i.classList.remove('active'); });
      
      // Show What's New section
      var allSections = document.querySelectorAll('.blank-section, .whats-new-section, .welcome-section');
      allSections.forEach(function(s) { s.classList.remove('active'); });
      document.getElementById('whatsNewSection').classList.add('active');
    });
  }
  
  // SpikeCoach Tab — one declared Overwolf window, shared by the button and match state.
  var SPIKE_TAB_WINDOW = 'SpikeCoachTab';
  var spikecoachTabBtn = document.getElementById('spikecoachTabBtn');
  var spikeTabVisible = false;
  var spikeTabOpening = false;
  var spikeTabGeneration = 0;

  function isSpikeCoachTabOpen() {
    return spikeTabVisible || spikeTabOpening;
  }

  function closeSpikeCoachTab() {
    console.log('[SpikeCoach GEP] closeSpikeCoachTab() called');
    spikeTabGeneration += 1;
    spikeTabVisible = false;
    spikeTabOpening = false;
    if (!window.overwolf || !overwolf.windows || !overwolf.windows.hide) {
      console.log('[SpikeCoach GEP] overwolf.windows.hide unavailable');
      return;
    }
    overwolf.windows.hide(SPIKE_TAB_WINDOW, function(result) {
      console.log('[SpikeCoach GEP] hide result:', result);
    });
  }

  function openSpikeCoachTab() {
    console.log('[SpikeCoach GEP] openSpikeCoachTab() called');
    if (!window.overwolf || !overwolf.windows || !overwolf.windows.obtainDeclaredWindow || !overwolf.windows.restore) {
      console.log('[SpikeCoach GEP] overwolf.windows.obtainDeclaredWindow unavailable');
      return;
    }
    if (spikeTabOpening) {
      return;
    }
    var generation = spikeTabGeneration;
    spikeTabOpening = true;
    overwolf.windows.obtainDeclaredWindow(SPIKE_TAB_WINDOW, function(result) {
      console.log('[SpikeCoach GEP] obtainDeclaredWindow result:', result);
      if (generation !== spikeTabGeneration) {
        spikeTabOpening = false;
        return;
      }
      if (!result || !result.success || !result.window) {
        spikeTabOpening = false;
        return;
      }
      var state = result.window.stateEx || result.window.state;
      if (state === 'normal' || state === 'maximized' || state === 'minimized') {
        spikeTabVisible = true;
        spikeTabOpening = false;
        if (state !== 'minimized' && overwolf.windows.bringToFront) {
          overwolf.windows.bringToFront(SPIKE_TAB_WINDOW, function(frontResult) {
            console.log('[SpikeCoach GEP] bringToFront result:', frontResult);
            centerSpikeCoachWindow();
          });
        } else if (state === 'minimized') {
          overwolf.windows.restore(SPIKE_TAB_WINDOW, function(restoreResult) {
            console.log('[SpikeCoach GEP] restore result:', restoreResult);
            if (restoreResult && restoreResult.success) centerSpikeCoachWindow();
          });
        }
        return;
      }
      overwolf.windows.restore(SPIKE_TAB_WINDOW, function(restoreResult) {
        console.log('[SpikeCoach GEP] restore result:', restoreResult);
        if (generation !== spikeTabGeneration) {
          spikeTabOpening = false;
          spikeTabVisible = false;
          overwolf.windows.hide(SPIKE_TAB_WINDOW, function() {});
          return;
        }
        spikeTabOpening = false;
        spikeTabVisible = !!(restoreResult && restoreResult.success);
        if (spikeTabVisible) centerSpikeCoachWindow();
      });
    });
  }

  function centerSpikeCoachWindow() {
    if (!window.overwolf || !overwolf.windows || !overwolf.windows.changePosition || !overwolf.utils || !overwolf.utils.getMonitorsList) return;
    var readGame = overwolf.games && (overwolf.games.getRunningGameInfo2 || overwolf.games.getRunningGameInfo);
    function place(gameInfo) {
      overwolf.utils.getMonitorsList(function (monitorResult) {
        overwolf.windows.obtainDeclaredWindow(SPIKE_TAB_WINDOW, function (winResult) {
          var win = winResult && winResult.window;
          var displays = (monitorResult && (monitorResult.displays || monitorResult.monitors)) || [];
          if (!win || !displays.length || !overwolf.windows.changePosition) return;
          var handle = gameInfo && gameInfo.monitorHandle;
          var handleValue = handle && handle.value != null ? handle.value : handle;
          var monitor = displays.filter(function (display) {
            var displayHandle = display.handle && display.handle.value != null ? display.handle.value : display.handle;
            return displayHandle === handleValue || display.id === handleValue || display.name === handleValue;
          })[0];
          if (!monitor) {
            monitor = displays.filter(function (display) { return display.is_primary; })[0] || displays[0];
          }
          var areaWidth = (gameInfo && (gameInfo.logicalWidth || gameInfo.width)) || monitor.width;
          var areaHeight = (gameInfo && (gameInfo.logicalHeight || gameInfo.height)) || monitor.height;
          var originX = monitor.x || 0;
          var originY = monitor.y || 0;
          if (areaWidth < monitor.width) originX += (monitor.width - areaWidth) / 2;
          if (areaHeight < monitor.height) originY += (monitor.height - areaHeight) / 2;
          var left = Math.round(originX + (areaWidth - win.width) / 2);
          var top = Math.round(originY + (areaHeight - win.height) / 2);
          var maxLeft = originX + areaWidth - win.width;
          var maxTop = originY + areaHeight - win.height;
          left = Math.max(Math.round(originX), Math.min(left, Math.round(maxLeft)));
          top = Math.max(Math.round(originY), Math.min(top, Math.round(maxTop)));
          overwolf.windows.changePosition(SPIKE_TAB_WINDOW, left, top, function (moveResult) {
            console.log('[SpikeCoach GEP] changePosition result:', moveResult);
          });
        });
      });
    }
    if (!readGame) {
      place(null);
      return;
    }
    readGame.call(overwolf.games, function (gameResult) {
      place(gameResult && (gameResult.gameInfo || gameResult));
    });
  }

  if (window.overwolf && overwolf.windows && overwolf.windows.onStateChanged) {
    overwolf.windows.onStateChanged.addListener(function(event) {
      if (!event || event.window_name !== SPIKE_TAB_WINDOW) return;
      var state = event.window_state_ex;
      spikeTabVisible = state === 'normal' || state === 'maximized' || state === 'minimized';
      if (state === 'hidden' || state === 'closed') {
        spikeTabOpening = false;
      }
    });
  }


  if (spikecoachTabBtn) {
    spikecoachTabBtn.addEventListener('click', openSpikeCoachTab);
  }

  // Valorant match state: open the same SpikeCoach tab on match_start, close it on match_end.
  // Docs: match_start / match_end are events on the match_info feature.
  (function initValorantMatchTab() {
    var LOG = '[SpikeCoach GEP]';
    var hasOverwolf = !!(window.overwolf);
    console.log(LOG, 'window.overwolf exists:', hasOverwolf);

    if (!hasOverwolf || !overwolf.games || !overwolf.games.events) {
      console.log(LOG, 'GEP init skipped — missing overwolf.games or overwolf.games.events');
      return;
    }

    var VALORANT_CLASS_ID = 21640;
    var REQUIRED_FEATURES = ['match_info', 'game_info', 'me', 'kill', 'death'];
    var featuresReady = false;
    var matchWasActive = false;
    var featuresPending = false;
    var featureTries = 0;

    function logValorantDetection(gameInfo, source) {
      var running = !!(gameInfo && gameInfo.isRunning);
      var classId = gameInfo && typeof gameInfo.classId !== 'undefined' ? gameInfo.classId : null;
      var instanceId = gameInfo && typeof gameInfo.id !== 'undefined' ? gameInfo.id : null;
      var detected = !!(gameInfo && gameInfo.isRunning && gameInfo.classId === VALORANT_CLASS_ID);
      console.log(LOG, 'Valorant detection (' + source + '):', {
        valorantDetected: detected,
        isRunning: running,
        classId: classId,
        instanceId: instanceId,
        title: gameInfo && gameInfo.title
      });
      return detected;
    }

    function isValorantRunning(gameInfo) {
      return !!(gameInfo && gameInfo.isRunning && gameInfo.classId === VALORANT_CLASS_ID);
    }

    var MATCH_INFO_FIELDS = ['map', 'scoreboard', 'round_phase', 'match_score', 'game_mode'];

    function logMatchInfo(source) {
      var INFO_LOG = '[SpikeCoach GEP getInfo]';
      overwolf.games.events.getInfo(function(result) {
        var res = result && result.res;
        var matchInfo = res && res.match_info ? res.match_info : null;
        var fields = {};
        MATCH_INFO_FIELDS.forEach(function(key) {
          fields[key] = !!(matchInfo && matchInfo[key] != null && matchInfo[key] !== '');
        });
        console.log(INFO_LOG, source, 'success:', !!(result && result.success), 'error:', result && result.error);
        console.log(INFO_LOG, source, 'match_info:', matchInfo);
        console.log(INFO_LOG, source, 'fields:', fields);
        if (result && result.success) {
          syncSpikeCoachTab(res && res.game_info, matchInfo);
        }
      });
    }

    function hasActiveRound(matchInfo) {
      if (!matchInfo || matchInfo.map == null || matchInfo.map === '') return false;
      var phase = matchInfo.round_phase;
      if (phase === 'shopping' || phase === 'combat' || phase === 'end') return true;
      return matchInfo.round_number != null && matchInfo.round_number !== '' && phase !== 'game_end';
    }

    function matchHasEnded(gameInfoBlock, matchInfo) {
      var state = gameInfoBlock && gameInfoBlock.state;
      var phase = matchInfo && matchInfo.round_phase;
      var outcome = matchInfo && matchInfo.match_outcome;
      if (state === 'LeavingMap' || state === 'Aborted' || phase === 'game_end') return true;
      if (state === 'WaitingToStart' && matchWasActive) return true;
      if (state !== 'InProgress' && (outcome === 'victory' || outcome === 'defeat' || outcome === 'draw')) return true;
      return false;
    }

    function syncSpikeCoachTab(gameInfoBlock, matchInfo) {
      if (matchHasEnded(gameInfoBlock, matchInfo)) {
        if (matchWasActive) {
          matchWasActive = false;
          closeSpikeCoachTab();
        }
        return;
      }
      var inProgress = !!(gameInfoBlock && gameInfoBlock.state === 'InProgress');
      if (inProgress || hasActiveRound(matchInfo)) {
        matchWasActive = true;
        if (!isSpikeCoachTabOpen()) {
          openSpikeCoachTab();
        }
      }
    }

    function registerValorantFeatures() {
      if (featuresReady || featuresPending) return;
      featuresPending = true;
      console.log(LOG, 'setRequiredFeatures called with:', REQUIRED_FEATURES);
      overwolf.games.events.setRequiredFeatures(REQUIRED_FEATURES, function(result) {
        featuresPending = false;
        console.log(LOG, 'setRequiredFeatures callback result:', result);
        if (result && result.success) {
          featuresReady = true;
          console.log(LOG, 'setRequiredFeatures success; supportedFeatures:', result.supportedFeatures);
          logMatchInfo('after setRequiredFeatures');
          return;
        }
        var reason = (result && (result.reason || result.error)) || '';
        var finalFailure = /not in a game|not supported|game_events/i.test(String(reason));
        if (!finalFailure && featureTries < 5) {
          featureTries += 1;
          console.log(LOG, 'setRequiredFeatures retry scheduled; attempt', featureTries, 'reason:', reason);
          setTimeout(registerValorantFeatures, 3000);
        } else {
          console.log(LOG, 'setRequiredFeatures stopped retrying; finalFailure:', finalFailure, 'reason:', reason);
        }
      });
    }

    function onRunningGame(result) {
      console.log(LOG, 'getRunningGameInfo2 full result:', result);
      var gameInfo = result && result.gameInfo ? result.gameInfo : result;
      if (isValorantRunning(gameInfo)) {
        logValorantDetection(gameInfo, 'getRunningGameInfo2');
        registerValorantFeatures();
      } else if (gameInfo) {
        logValorantDetection(gameInfo, 'getRunningGameInfo2');
      } else {
        console.log(LOG, 'getRunningGameInfo2: no running game (gameInfo null)');
      }
    }

    overwolf.games.onGameInfoUpdated.addListener(function(event) {
      console.log(LOG, 'onGameInfoUpdated fired:', event);
      var gameInfo = event && event.gameInfo;
      if (gameInfo) {
        logValorantDetection(gameInfo, 'onGameInfoUpdated');
      }
      if (isValorantRunning(gameInfo)) {
        registerValorantFeatures();
        return;
      }
      if (event && event.runningChanged) {
        featuresReady = false;
        featureTries = 0;
        console.log(LOG, 'onGameInfoUpdated runningChanged — reset GEP feature registration state');
      }
    });

    overwolf.games.events.onInfoUpdates2.addListener(function(payload) {
      console.log(LOG, 'onInfoUpdates2 payload:', payload);
      logMatchInfo('onInfoUpdates2');
    });

    overwolf.games.events.onError.addListener(function(errorEvent) {
      console.log(LOG, 'onError:', errorEvent);
    });

    overwolf.games.events.onNewEvents.addListener(function(payload) {
      console.log(LOG, 'onNewEvents payload:', payload);
      var events = (payload && payload.events) || [];
      events.forEach(function(gameEvent) {
        if (!gameEvent || !gameEvent.name) return;
        if (gameEvent.name === 'match_start') {
          console.log(LOG, 'match_start event received:', gameEvent);
          matchWasActive = true;
          if (!isSpikeCoachTabOpen()) {
            openSpikeCoachTab();
          }
        } else if (gameEvent.name === 'match_end') {
          console.log(LOG, 'match_end event received:', gameEvent);
          matchWasActive = false;
          closeSpikeCoachTab();
        }
      });
    });

    if (overwolf.games.getRunningGameInfo2) {
      overwolf.games.getRunningGameInfo2(onRunningGame);
    } else {
      console.log(LOG, 'getRunningGameInfo2 is not available on this client');
    }
  })();
  
  // Taskbar Navigation
  var taskbarItems = document.querySelectorAll('.taskbar-item');
  taskbarItems.forEach(function(item) {
    item.addEventListener('click', function() {
      // Remove active class from all items
      taskbarItems.forEach(function(i) { i.classList.remove('active'); });
      // Add active class to clicked item
      item.classList.add('active');
      
      // Get the section name from data attribute and show corresponding section
      var section = item.dataset.section;
      var sectionId = sectionMap[section];
      if (sectionId) {
        showSection(sectionId);
      }
    });
  });

  // Guess The Rank interactions (show subranks on click)
  var guessRankBaseRanks = document.getElementById('guessRankBaseRanks');
  var guessSubrankPanel = document.getElementById('guessSubrankPanel');
  if (guessRankBaseRanks && guessSubrankPanel) {
    guessRankBaseRanks.addEventListener('click', function(e) {
      var rankButton = e.target.closest('.guess-rank-icon-card');
      if (!rankButton) return;

      var rankName = rankButton.getAttribute('data-rank');
      var hasSubranks = rankButton.getAttribute('data-has-subranks') === 'true';
      var cards = guessRankBaseRanks.querySelectorAll('.guess-rank-icon-card');
      cards.forEach(function(card) { card.classList.remove('active'); });
      rankButton.classList.add('active');

      if (!hasSubranks) {
        guessSubrankPanel.innerHTML = `
          <div class="guess-subrank-title">${rankName}</div>
          <div class="guess-subrank-note">${rankName} has no subranks.</div>
        `;
        // Scroll down so the user can see the subrank area
        setTimeout(function() {
          guessSubrankPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
        return;
      }

      var subrankButtons = [1, 2, 3].map(function(subrank) {
        var subrankIconSrc = 'Rank_Icons/' + rankName + '_' + subrank + '_Rank.webp';
        return `
          <button class="guess-subrank-btn" data-rank="${rankName}" data-subrank="${subrank}">
            <img src="${subrankIconSrc}" alt="${rankName} ${subrank}">
            <span>${rankName} ${subrank}</span>
          </button>
        `;
      }).join('');

      guessSubrankPanel.innerHTML = `
        <div class="guess-subrank-title">${rankName} Subranks</div>
        <div class="guess-subrank-grid">
          ${subrankButtons}
        </div>
      `;
      // Scroll down so the user can see the subrank area
      setTimeout(function() {
        guessSubrankPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    });
  }
  
  // Store selected map and agent for line-ups flow
  var selectedMap = '';
  var selectedAgent = '';
  
  // Audio element for agent voices
  var agentAudio = new Audio();
  
  // Map agent names to audio file names
  var agentAudioMap = {
    'Astra': 'Astra Voice.mp3',
    'Breach': 'Breach Voice.mp3',
    'Brimstone': 'Brimstone Voice.mp3',
    'Chamber': 'Chamber Voice.mp3',
    'Clove': 'Clove Voice.mp3',
    'Cypher': 'Cypher Voice.mp3',
    'Deadlock': 'Deadlock Voice.mp3',
    'Fade': 'Fade Voice.mp3',
    'Gekko': 'Gekko Voice.mp3',
    'Harbor': 'Harbor Voice.mp3',
    'Iso': 'Iso Voice.mp3',
    'Jett': 'Jett Voice.mp3',
    'KAYO': 'Kayo Voice.mp3',
    'Killjoy': 'Killjoy Voice.mp3',
    'Neon': 'Neon Voice.mp3',
    'Omen': 'Omen Voice.mp3',
    'Phoenix': 'Phoenix Voice.mp3',
    'Raze': 'Raze Voice.mp3',
    'Reyna': 'Reyna Voice.mp3',
    'Sage': 'Sage Voice.mp3',
    'Skye': 'Skye Voice.mp3',
    'Sova': 'Sova Voice.mp3',
    'Tejo': 'Tejo Voice.mp3',
    'Veto': 'Veto Voice.mp3',
    'Viper': 'Viper Voice.mp3',
    'Vyse': 'Vyse Voice.mp3',
    'Waylay': 'Waylay Voice.mp3',
    'Yoru': 'Yoru Voice.mp3'
  };
  
  // Function to play agent audio
  function playAgentAudio(agentName) {
    var audioFile = agentAudioMap[agentName];
    if (audioFile) {
      agentAudio.src = 'Agent Audios/' + audioFile;
      agentAudio.play().catch(function(error) {
        console.log('Audio play failed:', error);
      });
    }
  }
  
  // Line-ups: agent first, then map, then detail
  document.querySelectorAll('#lineupsSection #agentsGrid .agent-card').forEach(function(card) {
    card.addEventListener('click', function() {
      selectedAgent = card.dataset.agent;
      playAgentAudio(selectedAgent);
      showMapSelect();
    });
  });

  document.querySelectorAll('#mapDetailSection #mapsGrid .map-card').forEach(function(card) {
    if (!card.querySelector('.map-lineup-disclaimer')) {
      card.classList.add('map-card--no-lineups');
      var disclaimer = document.createElement('span');
      disclaimer.className = 'map-lineup-disclaimer';
      disclaimer.textContent = 'No line-ups available';
      card.appendChild(disclaimer);
    }
    card.addEventListener('click', function() {
      if (card.classList.contains('map-card--no-lineups')) {
        return;
      }
      selectedMap = card.dataset.map;
      showLineupDetail(selectedAgent);
    });
  });

  var backToMapsBtn = document.getElementById('backToMapsBtn');
  if (backToMapsBtn) {
    backToMapsBtn.addEventListener('click', function() {
      showMapSelect();
    });
  }

  var backToAgentsBtn = document.getElementById('backToAgentsBtn');
  if (backToAgentsBtn) {
    backToAgentsBtn.addEventListener('click', function() {
      showSection('lineupsSection');
    });
  }
  
  // Post Lineup Button (placeholder for now)
  var postLineupBtn = document.getElementById('postLineupBtn');
  if (postLineupBtn) {
    postLineupBtn.addEventListener('click', function() {
      console.log('Post lineup clicked for map: ' + selectedMap);
      // Add functionality later
    });
  }
  
  function animateLineupsAgentCards() {
    document.querySelectorAll('#lineupsSection .agent-card').forEach(function(card, index) {
      card.classList.remove('animate-in');
      card.style.animationDelay = '';
      void card.offsetWidth;
      card.style.animationDelay = (index * 0.03) + 's';
      card.classList.add('animate-in');
    });
  }

  function showMapSelect() {
    var allSections = document.querySelectorAll('.blank-section, .whats-new-section, .welcome-section');
    allSections.forEach(function(s) { s.classList.remove('active'); });
    document.getElementById('mapDetailSection').classList.add('active');
    setTimeout(function() { animateMapCards('mapDetailSection'); }, 50);
  }

  function showLineupDetail(agentName) {
    var agent = agentName || selectedAgent;
    var allSections = document.querySelectorAll('.blank-section, .whats-new-section, .welcome-section');
    allSections.forEach(function(s) { s.classList.remove('active'); });
    document.getElementById('lineupDetailSection').classList.add('active');
    document.getElementById('selectedAgentTitle').textContent = agent + ' - ' + selectedMap;
  }
  
  // Generate random past games data
  function generateRandomGames() {
    var agents = ['Astra', 'Breach', 'Brimstone', 'Chamber', 'Clove', 'Cypher', 'Deadlock', 'Fade', 'Gekko', 'Harbor', 'Iso', 'Jett', 'KAYO', 'Killjoy', 'Neon', 'Omen', 'Phoenix', 'Raze', 'Reyna', 'Sage', 'Skye', 'Sova', 'Viper', 'Yoru'];
    var modes = ['Competitive', 'Unrated', 'Spike Rush', 'Swift Play'];
    var ranks = [
      'Iron_1_Rank', 'Iron_2_Rank', 'Iron_3_Rank',
      'Bronze_1_Rank', 'Bronze_2_Rank', 'Bronze_3_Rank',
      'Silver_1_Rank', 'Silver_2_Rank', 'Silver_3_Rank',
      'Gold_1_Rank', 'Gold_2_Rank', 'Gold_3_Rank',
      'Platinum_1_Rank', 'Platinum_2_Rank', 'Platinum_3_Rank',
      'Diamond_1_Rank', 'Diamond_2_Rank', 'Diamond_3_Rank',
      'Ascendant_1_Rank', 'Ascendant_2_Rank', 'Ascendant_3_Rank',
      'Immortal_1_Rank', 'Immortal_2_Rank', 'Immortal_3_Rank',
      'Radiant_Rank'
    ];
    
    // Function to generate score based on mode
    function generateScore(mode, isWin) {
      var playerScore, enemyScore;
      
      if (mode === 'Competitive') {
        if (isWin) {
          // Win scenarios
          if (Math.random() > 0.7) {
            // Overtime win (14-12, 15-13, etc)
            var overtimeRounds = Math.floor(Math.random() * 3);
            playerScore = 13 + overtimeRounds;
            enemyScore = 11 + overtimeRounds;
          } else {
            // Regular win (13-x where x < 12)
            playerScore = 13;
            enemyScore = Math.floor(Math.random() * 12);
          }
        } else {
          // Loss scenarios
          if (Math.random() > 0.7) {
            // Overtime loss
            var overtimeRounds = Math.floor(Math.random() * 3);
            playerScore = 11 + overtimeRounds;
            enemyScore = 13 + overtimeRounds;
          } else {
            // Regular loss
            playerScore = Math.floor(Math.random() * 12);
            enemyScore = 13;
          }
        }
      } else if (mode === 'Unrated') {
        // First to 13, no overtime
        if (isWin) {
          playerScore = 13;
          enemyScore = Math.floor(Math.random() * 13);
        } else {
          playerScore = Math.floor(Math.random() * 13);
          enemyScore = 13;
        }
      } else if (mode === 'Spike Rush') {
        // First to 4
        if (isWin) {
          playerScore = 4;
          enemyScore = Math.floor(Math.random() * 4);
        } else {
          playerScore = Math.floor(Math.random() * 4);
          enemyScore = 4;
        }
      } else if (mode === 'Swift Play') {
        // First to 5
        if (isWin) {
          playerScore = 5;
          enemyScore = Math.floor(Math.random() * 5);
        } else {
          playerScore = Math.floor(Math.random() * 5);
          enemyScore = 5;
        }
      }
      
      return { playerScore: playerScore, enemyScore: enemyScore };
    }
    
    var games = [];
    var currentDate = new Date();
    var currentRankIndex = 8; // Start at Silver 2
    
    for (var i = 0; i < 10; i++) {
      // Generate dates going backwards
      var daysAgo = i;
      var gameDate = new Date(currentDate);
      gameDate.setDate(gameDate.getDate() - daysAgo);
      
      // Steadily increase rank (with some variance)
      if (i > 0 && Math.random() > 0.3) { // 70% chance to rank up
        currentRankIndex = Math.min(currentRankIndex + 1, ranks.length - 1);
      }
      
      var mode = modes[Math.floor(Math.random() * modes.length)];
      var isWin = Math.random() > 0.5; // 50% win rate
      var score = generateScore(mode, isWin);
      
      var kills = Math.floor(Math.random() * 20) + 8;
      var deaths = Math.floor(Math.random() * 15) + 3;
      var assists = Math.floor(Math.random() * 12) + 2;
      
      games.push({
        date: gameDate,
        agent: agents[Math.floor(Math.random() * agents.length)],
        mode: mode,
        rank: ranks[currentRankIndex],
        isWin: isWin,
        playerScore: score.playerScore,
        enemyScore: score.enemyScore,
        kills: kills,
        deaths: deaths,
        assists: assists,
        hsPercent: Math.floor(Math.random() * 40) + 15, // 15-55%
        adr: Math.floor(Math.random() * 100) + 120, // 120-220
        acs: Math.floor(Math.random() * 150) + 150 // 150-300
      });
    }
    
    return games;
  }
  
  // Helper function to get "time ago" string
  function getTimeAgo(date) {
    var now = new Date();
    var diffMs = now - date;
    var diffMins = Math.floor(diffMs / 60000);
    var diffHours = Math.floor(diffMs / 3600000);
    var diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
      return diffMins === 0 ? 'Just now' : diffMins + ' minute' + (diffMins === 1 ? '' : 's') + ' ago';
    } else if (diffHours < 24) {
      return diffHours + ' hour' + (diffHours === 1 ? '' : 's') + ' ago';
    } else if (diffDays < 30) {
      return diffDays + ' day' + (diffDays === 1 ? '' : 's') + ' ago';
    } else {
      var diffMonths = Math.floor(diffDays / 30);
      return diffMonths + ' month' + (diffMonths === 1 ? '' : 's') + ' ago';
    }
  }
  
  // Generate random player names
  function generateRandomName() {
    var names = ['Shadow', 'Phoenix', 'Blade', 'Storm', 'Ghost', 'Viper', 'Reaper', 'Frost', 'Blaze', 'Rogue', 'Nova', 'Cipher', 'Wraith', 'Titan', 'Apex', 'Volt', 'Fury', 'Echo', 'Nexus', 'Zero'];
    var suffixes = ['YT', 'TTV', 'Pro', 'God', 'King', 'Ace', 'Main', 'Bot', '69', '420', 'OG', 'GG'];
    var name = names[Math.floor(Math.random() * names.length)];
    if (Math.random() > 0.5) {
      name += suffixes[Math.floor(Math.random() * suffixes.length)];
    }
    return name;
  }
  
  // Generate full match data (10 players)
  function generateFullMatchData(game, userAgent, userStats) {
    var agents = ['Astra', 'Breach', 'Brimstone', 'Chamber', 'Clove', 'Cypher', 'Deadlock', 'Fade', 'Gekko', 'Harbor', 'Iso', 'Jett', 'KAYO', 'Killjoy', 'Neon', 'Omen', 'Phoenix', 'Raze', 'Reyna', 'Sage', 'Skye', 'Sova', 'Viper', 'Yoru'];
    var ranks = ['Iron_1_Rank', 'Iron_2_Rank', 'Iron_3_Rank', 'Bronze_1_Rank', 'Bronze_2_Rank', 'Bronze_3_Rank', 'Silver_1_Rank', 'Silver_2_Rank', 'Silver_3_Rank', 'Gold_1_Rank', 'Gold_2_Rank', 'Gold_3_Rank', 'Platinum_1_Rank', 'Platinum_2_Rank', 'Platinum_3_Rank', 'Diamond_1_Rank', 'Diamond_2_Rank', 'Diamond_3_Rank', 'Ascendant_1_Rank', 'Ascendant_2_Rank', 'Ascendant_3_Rank'];
    
    var usedAgents = [userAgent];
    var playerTeam = [];
    var enemyTeam = [];
    
    // Get user's name
    var userName = localStorage.getItem('spikecoach_username') || 'Player';
    
    // Add user to their team
    playerTeam.push({
      name: userName,
      agent: userAgent,
      level: Math.floor(Math.random() * 200) + 50,
      rank: game.rank,
      kills: userStats.kills,
      deaths: userStats.deaths,
      assists: userStats.assists,
      hsPercent: userStats.hsPercent,
      adr: userStats.adr,
      acs: userStats.acs,
      isUser: true
    });
    
    // Generate 4 more teammates
    for (var i = 0; i < 4; i++) {
      var agent = agents[Math.floor(Math.random() * agents.length)];
      while (usedAgents.indexOf(agent) !== -1) {
        agent = agents[Math.floor(Math.random() * agents.length)];
      }
      usedAgents.push(agent);
      
      playerTeam.push({
        name: generateRandomName(),
        agent: agent,
        level: Math.floor(Math.random() * 300) + 20,
        rank: ranks[Math.floor(Math.random() * ranks.length)],
        kills: Math.floor(Math.random() * 20) + 5,
        deaths: Math.floor(Math.random() * 15) + 3,
        assists: Math.floor(Math.random() * 12) + 2,
        hsPercent: Math.floor(Math.random() * 40) + 15,
        adr: Math.floor(Math.random() * 100) + 120,
        acs: Math.floor(Math.random() * 150) + 150,
        isUser: false
      });
    }
    
    // Generate 5 enemy players
    for (var j = 0; j < 5; j++) {
      var enemyAgent = agents[Math.floor(Math.random() * agents.length)];
      while (usedAgents.indexOf(enemyAgent) !== -1) {
        enemyAgent = agents[Math.floor(Math.random() * agents.length)];
      }
      usedAgents.push(enemyAgent);
      
      enemyTeam.push({
        name: generateRandomName(),
        agent: enemyAgent,
        level: Math.floor(Math.random() * 300) + 20,
        rank: ranks[Math.floor(Math.random() * ranks.length)],
        kills: Math.floor(Math.random() * 20) + 5,
        deaths: Math.floor(Math.random() * 15) + 3,
        assists: Math.floor(Math.random() * 12) + 2,
        hsPercent: Math.floor(Math.random() * 40) + 15,
        adr: Math.floor(Math.random() * 100) + 120,
        acs: Math.floor(Math.random() * 150) + 150,
        isUser: false
      });
    }
    
    // Sort teams by ACS (highest first)
    playerTeam.sort(function(a, b) { return b.acs - a.acs; });
    enemyTeam.sort(function(a, b) { return b.acs - a.acs; });
    
    return {
      playerTeam: playerTeam,
      enemyTeam: enemyTeam
    };
  }
  
  // Show match details popup
  function showMatchDetails(game) {
    var matchData = generateFullMatchData(game, game.agent, {
      kills: game.kills,
      deaths: game.deaths,
      assists: game.assists,
      hsPercent: game.hsPercent,
      adr: game.adr,
      acs: game.acs
    });
    
    var html = '<div class="match-details-overlay" id="matchDetailsOverlay">' +
      '<div class="match-details-modal">' +
        '<button class="match-close-btn" id="matchCloseBtn">✕</button>' +
        '<div class="match-header">' +
          '<h2 class="match-title">' + game.mode + '</h2>' +
          '<div class="match-score-large">' +
            '<span class="score-player-large score-' + (game.isWin ? 'win' : 'loss') + '">' + game.playerScore + '</span>' +
            '<span class="score-separator-large">-</span>' +
            '<span class="score-enemy-large score-' + (game.isWin ? 'loss' : 'win') + '">' + game.enemyScore + '</span>' +
          '</div>' +
          '<div class="match-result ' + (game.isWin ? 'victory' : 'defeat') + '">' + (game.isWin ? 'VICTORY' : 'DEFEAT') + '</div>' +
        '</div>' +
        '<div class="match-teams-container">' +
          '<div class="match-team ' + (game.isWin ? 'team-win' : 'team-loss') + '">' +
            '<div class="team-header">Your Team</div>' +
            '<div class="team-players">' + renderTeamPlayers(matchData.playerTeam) + '</div>' +
          '</div>' +
          '<div class="match-team ' + (game.isWin ? 'team-loss' : 'team-win') + '">' +
            '<div class="team-header">Enemy Team</div>' +
            '<div class="team-players">' + renderTeamPlayers(matchData.enemyTeam) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    // Add event listeners
    var overlay = document.getElementById('matchDetailsOverlay');
    var closeBtn = document.getElementById('matchCloseBtn');
    
    closeBtn.addEventListener('click', function() {
      closeMatchDetails();
    });
    
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeMatchDetails();
      }
    });
  }
  
  function renderTeamPlayers(team) {
    var html = '';
    team.forEach(function(player) {
      var agentIcon = 'Agent_Icons/' + player.agent + '_icon.webp';
      if (player.agent === 'KAYO') {
        agentIcon = 'Agent_Icons/KAYO_icon.webp';
      }
      
      var userClass = player.isUser ? 'player-row-user' : '';
      
      html += '<div class="player-row ' + userClass + '">' +
        '<img src="' + agentIcon + '" alt="' + player.agent + '" class="player-agent-icon">' +
        '<div class="player-info-section">' +
          '<div class="player-name">' + player.name + '</div>' +
          '<div class="player-level">Level ' + player.level + '</div>' +
        '</div>' +
        '<img src="Rank_Icons/' + player.rank + '.webp" alt="Rank" class="player-rank-icon">' +
        '<div class="player-stat-item">' +
          '<span class="player-stat-label">K/D/A</span>' +
          '<span class="player-stat-value">' + player.kills + '/' + player.deaths + '/' + player.assists + '</span>' +
        '</div>' +
        '<div class="player-stat-item">' +
          '<span class="player-stat-label">HS%</span>' +
          '<span class="player-stat-value">' + player.hsPercent + '%</span>' +
        '</div>' +
        '<div class="player-stat-item">' +
          '<span class="player-stat-label">ADR</span>' +
          '<span class="player-stat-value">' + player.adr + '</span>' +
        '</div>' +
        '<div class="player-stat-item">' +
          '<span class="player-stat-label">ACS</span>' +
          '<span class="player-stat-value">' + player.acs + '</span>' +
        '</div>' +
      '</div>';
    });
    return html;
  }
  
  function closeMatchDetails() {
    var overlay = document.getElementById('matchDetailsOverlay');
    if (overlay) {
      overlay.remove();
    }
  }
  
  // Render past games
  function renderPastGames() {
    var gamesList = document.getElementById('pastGamesList');
    if (!gamesList) return;
    
    var games = generateRandomGames();
    var html = '';
    var lastDate = '';
    
    games.forEach(function(game, index) {
      var dateStr = game.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      var timeAgo = getTimeAgo(game.date);
      
      // Add date header if it's a new date
      if (dateStr !== lastDate) {
        html += '<div class="game-date-header">' + 
          '<span class="date-text">' + dateStr + '</span>' +
          '<span class="time-ago-text">' + timeAgo + '</span>' +
        '</div>';
        lastDate = dateStr;
      }
      
      // Get agent icon filename
      var agentIcon = 'Agent_Icons/' + game.agent + '_icon.webp';
      if (game.agent === 'KAYO') {
        agentIcon = 'Agent_Icons/KAYO_icon.webp';
      }
      
      var winLossClass = game.isWin ? 'game-win' : 'game-loss';
      
      html += '<div class="game-card ' + winLossClass + '" data-game-index="' + index + '">' +
        '<div class="game-card-left">' +
          '<img src="' + agentIcon + '" alt="' + game.agent + '" class="game-agent-icon">' +
          '<div class="game-info">' +
            '<div class="game-mode">' + game.mode + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="game-card-center">' +
          '<div class="game-score">' +
            '<span class="score-player score-' + (game.isWin ? 'win' : 'loss') + '">' + game.playerScore + '</span>' +
            '<span class="score-separator">-</span>' +
            '<span class="score-enemy score-' + (game.isWin ? 'loss' : 'win') + '">' + game.enemyScore + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="game-card-right">' +
          '<img src="Rank_Icons/' + game.rank + '.webp" alt="Rank" class="game-rank-icon">' +
          '<div class="game-stat" title="Kill/Death/Assist">' +
            '<span class="stat-label">KDA</span>' +
            '<span class="stat-value">' + game.kills + '/' + game.deaths + '/' + game.assists + '</span>' +
          '</div>' +
          '<div class="game-stat" title="Headshot Percentage">' +
            '<span class="stat-label">HS%</span>' +
            '<span class="stat-value">' + game.hsPercent + '%</span>' +
          '</div>' +
          '<div class="game-stat" title="Average Damage per Round">' +
            '<span class="stat-label">ADR</span>' +
            '<span class="stat-value">' + game.adr + '</span>' +
          '</div>' +
          '<div class="game-stat" title="Average Combat Score">' +
            '<span class="stat-label">ACS</span>' +
            '<span class="stat-value">' + game.acs + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    });
    
    gamesList.innerHTML = html;
    
    // Add click handlers to game cards
    var gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(function(card) {
      card.addEventListener('click', function() {
        var gameIndex = parseInt(this.getAttribute('data-game-index'));
        showMatchDetails(games[gameIndex]);
      });
    });
  }
  
  // Call renderPastGames when the section becomes active
  var originalShowSection = showSection;
  showSection = function(sectionId) {
    originalShowSection(sectionId);
    if (sectionId === 'pastGamesSection') {
      renderPastGames();
    }
    if (sectionId === 'strategySection' && StrategyPlanner.showMapPicker) {
      StrategyPlanner.showMapPicker();
    }
  };

  // Strategy Planner (Strategy tab) — extend via layers.abilities / layers.arrows / serializeState
  var StrategyPlanner = (function() {
    var TEAM_IDS = ['blue', 'red'];
    var SLOTS_PER_TEAM = 5;
    var MAP_POS_MIN = 6;
    var MAP_POS_MAX = 94;

    var VALORANT_AGENTS = [
      { id: 'Astra', label: 'Astra' }, { id: 'Breach', label: 'Breach' }, { id: 'Brimstone', label: 'Brimstone' },
      { id: 'Chamber', label: 'Chamber' }, { id: 'Clove', label: 'Clove' }, { id: 'Cypher', label: 'Cypher' },
      { id: 'Deadlock', label: 'Deadlock' }, { id: 'Fade', label: 'Fade' }, { id: 'Gekko', label: 'Gekko' },
      { id: 'Harbor', label: 'Harbor' }, { id: 'Iso', label: 'Iso' }, { id: 'Jett', label: 'Jett' },
      { id: 'KAYO', label: 'KAY/O' }, { id: 'Killjoy', label: 'Killjoy' }, { id: 'Miks', label: 'Miks' },
      { id: 'Neon', label: 'Neon' },
      { id: 'Omen', label: 'Omen' }, { id: 'Phoenix', label: 'Phoenix' }, { id: 'Raze', label: 'Raze' },
      { id: 'Reyna', label: 'Reyna' }, { id: 'Sage', label: 'Sage' }, { id: 'Skye', label: 'Skye' },
      { id: 'Sova', label: 'Sova' }, { id: 'Tejo', label: 'Tejo' }, { id: 'Veto', label: 'Veto' },
      { id: 'Viper', label: 'Viper' }, { id: 'Vyse', label: 'Vyse' }, { id: 'Waylay', label: 'Waylay' },
      { id: 'Yoru', label: 'Yoru' }
    ];

    var dom = {};
    var state = {
      mapName: null,
      teams: {},
      picker: { teamId: null, slotIndex: null },
      focusedMapAgent: null,
      mapSelection: null,
      arrows: [],
      drag: null
    };

    // Future: ability icons, arrows, annotations — render into strategyMapLayer or sibling SVG
    var layers = {
      markers: null,
      abilities: null,
      arrows: null,
      annotations: null
    };

    function agentIconSrc(agentId) {
      return 'Agent_Icons/' + agentId + '_icon.webp';
    }

    function getAgentAbilities(agentId) {
      var manifest = window.AGENT_ABILITY_MANIFEST || {};
      return manifest[agentId] || [];
    }

    function isMapMarkerFocused(teamId, slotIndex) {
      return state.focusedMapAgent &&
        state.focusedMapAgent.teamId === teamId &&
        state.focusedMapAgent.slotIndex === slotIndex;
    }

    function isSameMapSelection(sel, type, teamId, slotIndex, abilityId) {
      if (!sel || sel.type !== type || sel.teamId !== teamId || sel.slotIndex !== slotIndex) return false;
      if (type === 'ability') return sel.abilityId === abilityId;
      return true;
    }

    function setMapSelection(selection) {
      state.mapSelection = selection;
      if (selection && selection.type === 'agent') {
        state.focusedMapAgent = { teamId: selection.teamId, slotIndex: selection.slotIndex };
      } else {
        state.focusedMapAgent = null;
      }
      renderAllSlots();
      syncMapScene();
    }

    function clearMapSelection() {
      state.mapSelection = null;
      state.focusedMapAgent = null;
      renderAllSlots();
      syncMapScene();
    }

    function toggleMapMarkerFocus(teamId, slotIndex) {
      if (isMapMarkerFocused(teamId, slotIndex)) {
        clearMapSelection();
      } else {
        setMapSelection({ type: 'agent', teamId: teamId, slotIndex: slotIndex });
      }
    }

    function clearMapMarkerFocus() {
      if (!state.focusedMapAgent && !state.mapSelection) return;
      clearMapSelection();
    }

    function createEmptySlot() {
      return { agentId: null, mapPos: null, abilityPlacements: [] };
    }

    function genMapItemId(prefix) {
      return prefix + '-' + Math.random().toString(36).slice(2, 10);
    }

    function getAnchorMapPct(anchor) {
      if (!anchor) return null;
      var slot = getTeam(anchor.teamId).slots[anchor.slotIndex];
      if (!slot) return null;
      if (anchor.type === 'agent' || anchor.type === 'ability-tray') {
        return slot.mapPos ? { x: slot.mapPos.x, y: slot.mapPos.y } : null;
      }
      if (anchor.type === 'ability') {
        for (var i = 0; i < slot.abilityPlacements.length; i++) {
          var pl = slot.abilityPlacements[i];
          if (pl.id === anchor.abilityId) return pl.mapPos ? { x: pl.mapPos.x, y: pl.mapPos.y } : null;
        }
      }
      return null;
    }

    function resolveArrowStart(arrow) {
      if (arrow.anchor) {
        var anchored = getAnchorMapPct(arrow.anchor);
        if (anchored) return anchored;
      }
      return arrow.startPct;
    }

    function removeArrowsForSlot(teamId, slotIndex) {
      state.arrows = state.arrows.filter(function(arrow) {
        if (!arrow.anchor) return true;
        return !(arrow.anchor.teamId === teamId && arrow.anchor.slotIndex === slotIndex);
      });
    }

    function removeArrowsForAbility(teamId, slotIndex, abilityId) {
      state.arrows = state.arrows.filter(function(arrow) {
        if (!arrow.anchor) return true;
        if (arrow.anchor.type !== 'ability') return true;
        return !(arrow.anchor.teamId === teamId &&
          arrow.anchor.slotIndex === slotIndex &&
          arrow.anchor.abilityId === abilityId);
      });
    }

    function isInsideMapClient(clientX, clientY) {
      var rect = dom.minimapContainer.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right &&
        clientY >= rect.top && clientY <= rect.bottom;
    }

    function removeAgentFromMap(teamId, slotIndex) {
      var slot = getTeam(teamId).slots[slotIndex];
      if (!slot || !slot.mapPos) return;
      slot.mapPos = null;
      slot.abilityPlacements = [];
      removeArrowsForSlot(teamId, slotIndex);
      if (state.mapSelection && state.mapSelection.type === 'agent' &&
          state.mapSelection.teamId === teamId && state.mapSelection.slotIndex === slotIndex) {
        clearMapSelection();
      } else if (state.mapSelection && state.mapSelection.type === 'ability' &&
          state.mapSelection.teamId === teamId && state.mapSelection.slotIndex === slotIndex) {
        clearMapSelection();
      }
      syncMapScene();
    }

    function removeAbilityFromMap(teamId, slotIndex, abilityId) {
      var slot = getTeam(teamId).slots[slotIndex];
      if (!slot || !slot.abilityPlacements) return;
      slot.abilityPlacements = slot.abilityPlacements.filter(function(p) { return p.id !== abilityId; });
      removeArrowsForAbility(teamId, slotIndex, abilityId);
      if (isSameMapSelection(state.mapSelection, 'ability', teamId, slotIndex, abilityId)) {
        state.mapSelection = null;
      }
      syncMapScene();
    }

    function deleteSelectedMapItem() {
      var sel = state.mapSelection;
      if (!sel) return;
      if (sel.type === 'agent') removeAgentFromMap(sel.teamId, sel.slotIndex);
      else if (sel.type === 'ability') removeAbilityFromMap(sel.teamId, sel.slotIndex, sel.abilityId);
      else if (sel.type === 'team-slot') clearSlot(sel.teamId, sel.slotIndex);
    }

    function isEditableTarget(el) {
      if (!el) return false;
      var tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    }

    function createEmptyTeamState() {
      var slots = [];
      for (var i = 0; i < SLOTS_PER_TEAM; i++) slots.push(createEmptySlot());
      return { slots: slots };
    }

    function resetTeams() {
      state.teams = { blue: createEmptyTeamState(), red: createEmptyTeamState() };
      clearMapSelection();
      state.arrows = [];
    }

    function clampMapPct(n) {
      return Math.min(MAP_POS_MAX, Math.max(MAP_POS_MIN, n));
    }

    function getTeam(teamId) {
      return state.teams[teamId];
    }

    function slotKey(teamId, slotIndex) {
      return teamId + '-' + slotIndex;
    }

    function isAgentOnTeam(teamId, agentId, ignoreSlotIndex) {
      var team = getTeam(teamId);
      if (!team) return false;
      for (var i = 0; i < team.slots.length; i++) {
        if (ignoreSlotIndex !== undefined && i === ignoreSlotIndex) continue;
        if (team.slots[i].agentId === agentId) return true;
      }
      return false;
    }

    function clientToMapPercent(clientX, clientY) {
      var rect = dom.minimapContainer.getBoundingClientRect();
      var x = ((clientX - rect.left) / rect.width) * 100;
      var y = ((clientY - rect.top) / rect.height) * 100;
      return { x: clampMapPct(x), y: clampMapPct(y) };
    }

    function renderAllSlots() {
      TEAM_IDS.forEach(function(teamId) {
        var container = teamId === 'blue' ? dom.blueSlots : dom.redSlots;
        if (!container) return;
        container.innerHTML = '';
        var team = getTeam(teamId);
        team.slots.forEach(function(slot, index) {
          container.appendChild(buildSlotElement(teamId, index, slot));
        });
      });
      syncMapScene();
    }

    function buildSlotElement(teamId, slotIndex, slot) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'strategy-agent-slot' +
        (slot.agentId ? ' is-filled' : ' is-empty') +
        (isSameMapSelection(state.mapSelection, 'team-slot', teamId, slotIndex) ? ' is-selected' : '');
      btn.dataset.team = teamId;
      btn.dataset.slot = String(slotIndex);
      btn.setAttribute('aria-label', slot.agentId ? slot.agentId + ' slot' : 'Empty agent slot');

      if (slot.agentId) {
        var img = document.createElement('img');
        img.src = agentIconSrc(slot.agentId);
        img.alt = slot.agentId;
        img.draggable = false;
        btn.appendChild(img);
        btn.title = 'Click to select · double-click to change · drag onto map · drag off map to delete';
      } else {
        btn.innerHTML = '<span class="strategy-slot-plus">+</span>';
        btn.title = 'Select agent';
      }

      btn.addEventListener('click', function() {
        if (btn.dataset.suppressClick === '1') {
          btn.dataset.suppressClick = '0';
          return;
        }
        if (!slot.agentId) {
          openAgentPicker(teamId, slotIndex);
          return;
        }
        if (isSameMapSelection(state.mapSelection, 'team-slot', teamId, slotIndex)) {
          clearMapSelection();
        } else {
          setMapSelection({ type: 'team-slot', teamId: teamId, slotIndex: slotIndex });
        }
      });

      btn.addEventListener('dblclick', function(e) {
        e.preventDefault();
        if (slot.agentId) openAgentPicker(teamId, slotIndex);
      });

      if (slot.agentId) {
        btn.addEventListener('pointerdown', function(e) {
          if (e.button !== 0) return;
          startSlotToMapDrag(e, teamId, slotIndex, btn);
        });
      }

      return btn;
    }

    function syncMapScene() {
      if (!dom.entitiesLayer) return;
      dom.entitiesLayer.innerHTML = '';
      TEAM_IDS.forEach(function(teamId) {
        getTeam(teamId).slots.forEach(function(slot, slotIndex) {
          if (!slot.abilityPlacements) slot.abilityPlacements = [];
          if (slot.agentId && slot.mapPos) {
            dom.entitiesLayer.appendChild(buildMapMarkerElement(teamId, slotIndex, slot));
          }
          slot.abilityPlacements.forEach(function(placement) {
            dom.entitiesLayer.appendChild(buildAbilityMapMarker(teamId, slotIndex, placement));
          });
        });
      });
      syncArrows();
    }

    function bindIconContextMenu(el) {
      el.addEventListener('contextmenu', function(e) {
        e.preventDefault();
      });
    }

    function buildAbilityTray(agentId, teamId, slotIndex) {
      var tray = document.createElement('div');
      tray.className = 'strategy-ability-tray';
      tray.addEventListener('click', function(e) { e.stopPropagation(); });

      var abilities = getAgentAbilities(agentId);
      if (!abilities.length) {
        var empty = document.createElement('span');
        empty.className = 'strategy-ability-empty';
        empty.textContent = 'No abilities';
        tray.appendChild(empty);
        return tray;
      }

      abilities.forEach(function(ability) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'strategy-ability-btn';
        btn.title = ability.label + ' · drag to map · right-click for arrow';
        btn.dataset.abilitySrc = ability.src;
        var img = document.createElement('img');
        img.src = ability.src;
        img.alt = ability.label;
        btn.appendChild(img);
        var label = document.createElement('span');
        label.textContent = ability.label;
        btn.appendChild(label);

        btn.addEventListener('pointerdown', function(e) {
          e.stopPropagation();
          if (e.button === 2) {
            e.preventDefault();
            startArrowDraft(e, {
              type: 'ability-tray',
              teamId: teamId,
              slotIndex: slotIndex
            }, teamId);
            return;
          }
          if (e.button !== 0) return;
          startAbilityTrayDrag(e, teamId, slotIndex, ability, btn);
        });

        bindIconContextMenu(btn);
        tray.appendChild(btn);
      });

      return tray;
    }

    function buildAbilityMapMarker(teamId, slotIndex, placement) {
      var el = document.createElement('div');
      el.className = 'strategy-ability-map-marker team-' + teamId +
        (isSameMapSelection(state.mapSelection, 'ability', teamId, slotIndex, placement.id) ? ' is-selected' : '');
      el.style.left = placement.mapPos.x + '%';
      el.style.top = placement.mapPos.y + '%';
      el.dataset.abilityId = placement.id;
      el.title = placement.label + ' · drag to move · right-click for arrow';

      var img = document.createElement('img');
      img.src = placement.src;
      img.alt = placement.label;
      img.draggable = false;
      el.appendChild(img);

      el.addEventListener('pointerdown', function(e) {
        e.stopPropagation();
        if (e.button === 2) {
          e.preventDefault();
          startArrowDraft(e, {
            type: 'ability',
            teamId: teamId,
            slotIndex: slotIndex,
            abilityId: placement.id
          }, teamId);
          return;
        }
        if (e.button !== 0) return;
        startAbilityMapDrag(e, teamId, slotIndex, placement.id, el);
      });

      bindIconContextMenu(el);
      return el;
    }

    function buildMapMarkerElement(teamId, slotIndex, slot) {
      var group = document.createElement('div');
      group.className = 'strategy-marker-group' + (isMapMarkerFocused(teamId, slotIndex) ? ' is-focused' : '');
      group.dataset.team = teamId;
      group.dataset.slot = String(slotIndex);
      group.style.left = slot.mapPos.x + '%';
      group.style.top = slot.mapPos.y + '%';

      var el = document.createElement('div');
      el.className = 'agent-marker strategy-map-marker team-' + teamId;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', slot.agentId + ' on map. Click for abilities.');

      var img = document.createElement('img');
      img.src = agentIconSrc(slot.agentId);
      img.alt = slot.agentId;
      img.draggable = false;
      el.appendChild(img);

      el.addEventListener('pointerdown', function(e) {
        e.stopPropagation();
        if (e.button === 2) {
          e.preventDefault();
          startArrowDraft(e, {
            type: 'agent',
            teamId: teamId,
            slotIndex: slotIndex
          }, teamId);
          return;
        }
        if (e.button !== 0) return;
        startMapMarkerDrag(e, teamId, slotIndex, group);
      });

      bindIconContextMenu(el);
      group.appendChild(el);

      if (isMapMarkerFocused(teamId, slotIndex)) {
        group.appendChild(buildAbilityTray(slot.agentId, teamId, slotIndex));
      }

      return group;
    }

    function ensureArrowDefs() {
      if (dom.arrowSvg.querySelector('defs')) return;
      var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      var marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'strategyArrowHead');
      marker.setAttribute('markerWidth', '4');
      marker.setAttribute('markerHeight', '4');
      marker.setAttribute('refX', '3.2');
      marker.setAttribute('refY', '2');
      marker.setAttribute('orient', 'auto');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M0,0 L4,2 L0,4 Z');
      path.setAttribute('fill', 'currentColor');
      marker.appendChild(path);
      defs.appendChild(marker);
      dom.arrowSvg.appendChild(defs);
    }

    function syncArrows() {
      if (!dom.arrowSvg) return;
      dom.arrowSvg.querySelectorAll('.strategy-arrow-shape').forEach(function(n) { n.remove(); });
      ensureArrowDefs();

      state.arrows.forEach(function(arrow) {
        var start = resolveArrowStart(arrow);
        if (!start || !arrow.endPct) return;
        var color = arrow.teamId === 'blue' ? '#5dade2' : '#ec7063';
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'strategy-arrow-shape');
        g.dataset.arrowId = arrow.id;

        var hit = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hit.setAttribute('class', 'strategy-arrow-hit');
        hit.setAttribute('x1', start.x);
        hit.setAttribute('y1', start.y);
        hit.setAttribute('x2', arrow.endPct.x);
        hit.setAttribute('y2', arrow.endPct.y);

        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'strategy-arrow-line');
        line.setAttribute('x1', start.x);
        line.setAttribute('y1', start.y);
        line.setAttribute('x2', arrow.endPct.x);
        line.setAttribute('y2', arrow.endPct.y);
        line.setAttribute('stroke', color);
        line.setAttribute('marker-end', 'url(#strategyArrowHead)');

        var endCap = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        endCap.setAttribute('class', 'strategy-arrow-end');
        endCap.setAttribute('cx', arrow.endPct.x);
        endCap.setAttribute('cy', arrow.endPct.y);
        endCap.setAttribute('r', '1.4');
        endCap.setAttribute('fill', color);

        hit.addEventListener('pointerdown', function(e) {
          if (e.button !== 0) return;
          e.stopPropagation();
          startArrowMove(e, arrow.id);
        });
        endCap.addEventListener('pointerdown', function(e) {
          if (e.button !== 0) return;
          e.stopPropagation();
          startArrowEndDrag(e, arrow.id);
        });

        g.appendChild(hit);
        g.appendChild(line);
        g.appendChild(endCap);
        dom.arrowSvg.appendChild(g);
      });
    }

    function setSlotAgent(teamId, slotIndex, agentId) {
      var slot = getTeam(teamId).slots[slotIndex];
      slot.agentId = agentId;
      slot.mapPos = null;
      closeAgentPicker();
      renderAllSlots();
    }

    function clearSlot(teamId, slotIndex) {
      if (isMapMarkerFocused(teamId, slotIndex) ||
          (state.mapSelection && state.mapSelection.teamId === teamId && state.mapSelection.slotIndex === slotIndex)) {
        clearMapSelection();
      }
      removeArrowsForSlot(teamId, slotIndex);
      getTeam(teamId).slots[slotIndex] = createEmptySlot();
      closeAgentPicker();
      renderAllSlots();
    }

    function setSlotMapPos(teamId, slotIndex, mapPos) {
      getTeam(teamId).slots[slotIndex].mapPos = mapPos;
      syncMapScene();
    }

    function findAbilityPlacement(teamId, slotIndex, abilityId) {
      var slot = getTeam(teamId).slots[slotIndex];
      for (var i = 0; i < slot.abilityPlacements.length; i++) {
        if (slot.abilityPlacements[i].id === abilityId) return slot.abilityPlacements[i];
      }
      return null;
    }

    function detachArrowIfAnchored(arrow) {
      if (!arrow.anchor) return;
      var start = resolveArrowStart(arrow);
      arrow.startPct = { x: start.x, y: start.y };
      arrow.anchor = null;
    }

    function openAgentPicker(teamId, slotIndex) {
      state.picker.teamId = teamId;
      state.picker.slotIndex = slotIndex;
      var slot = getTeam(teamId).slots[slotIndex];
      var teamLabel = teamId === 'blue' ? 'Blue' : 'Red';
      dom.pickerTitle.textContent = 'Select agent · ' + teamLabel + ' slot ' + (slotIndex + 1);
      dom.pickerRemove.hidden = !slot.agentId;
      dom.pickerGrid.innerHTML = '';

      VALORANT_AGENTS.forEach(function(agent) {
        var taken = isAgentOnTeam(teamId, agent.id, slotIndex);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'strategy-agent-pick' + (taken ? ' is-disabled' : '') + (slot.agentId === agent.id ? ' is-current' : '');
        btn.disabled = taken;
        btn.dataset.agentId = agent.id;
        btn.innerHTML = '<img src="' + agentIconSrc(agent.id) + '" alt=""><span>' + agent.label + '</span>';
        btn.addEventListener('click', function() {
          if (taken) return;
          setSlotAgent(teamId, slotIndex, agent.id);
        });
        dom.pickerGrid.appendChild(btn);
      });

      dom.picker.hidden = false;
    }

    function closeAgentPicker() {
      state.picker.teamId = null;
      state.picker.slotIndex = null;
      dom.picker.hidden = true;
    }

    function endDrag() {
      if (!state.drag) return;
      if (state.drag.previewLine && state.drag.previewLine.parentNode) {
        state.drag.previewLine.parentNode.removeChild(state.drag.previewLine);
      }
      if (state.drag.ghost && state.drag.ghost.parentNode) {
        state.drag.ghost.parentNode.removeChild(state.drag.ghost);
      }
      document.removeEventListener('pointermove', onDragMove);
      document.removeEventListener('pointerup', onDragEnd);
      document.removeEventListener('pointercancel', onDragEnd);
      state.drag = null;
      syncArrows();
    }

    function onDragMove(e) {
      if (!state.drag) return;
      var d = state.drag;
      if (d.startX !== undefined) {
        var dx = e.clientX - d.startX;
        var dy = e.clientY - d.startY;
        if (Math.hypot(dx, dy) > 4) d.moved = true;
      }
      if (d.ghost) {
        d.ghost.style.left = e.clientX + 'px';
        d.ghost.style.top = e.clientY + 'px';
      }
      if (d.mode === 'marker') {
        if (!isInsideMapClient(e.clientX, e.clientY)) return;
        var pos = clientToMapPercent(e.clientX, e.clientY);
        var slot = getTeam(d.teamId).slots[d.slotIndex];
        slot.mapPos = pos;
        if (d.groupEl) {
          d.groupEl.style.left = pos.x + '%';
          d.groupEl.style.top = pos.y + '%';
        }
        syncArrows();
      }
      if (d.mode === 'ability-map') {
        if (!isInsideMapClient(e.clientX, e.clientY)) return;
        var abPos = clientToMapPercent(e.clientX, e.clientY);
        var placement = findAbilityPlacement(d.teamId, d.slotIndex, d.abilityId);
        if (placement) placement.mapPos = abPos;
        if (d.el) {
          d.el.style.left = abPos.x + '%';
          d.el.style.top = abPos.y + '%';
        }
        syncArrows();
      }
      if (d.mode === 'arrow-draft') {
        d.endPct = clientToMapPercent(e.clientX, e.clientY);
        if (d.previewLine) {
          d.previewLine.setAttribute('x2', d.endPct.x);
          d.previewLine.setAttribute('y2', d.endPct.y);
        }
      }
      if (d.mode === 'arrow-move' || d.mode === 'arrow-end') {
        var arrow = state.arrows.find(function(a) { return a.id === d.arrowId; });
        if (!arrow) return;
        var cur = clientToMapPercent(e.clientX, e.clientY);
        if (!d.lastPct) d.lastPct = cur;
        var delta = { x: cur.x - d.lastPct.x, y: cur.y - d.lastPct.y };
        d.lastPct = cur;
        if (d.mode === 'arrow-end') {
          if (!arrow.endPct) arrow.endPct = { x: cur.x, y: cur.y };
          arrow.endPct.x = clampMapPct(arrow.endPct.x + delta.x);
          arrow.endPct.y = clampMapPct(arrow.endPct.y + delta.y);
        } else {
          if (!arrow.startPct) {
            var s = resolveArrowStart(arrow);
            arrow.startPct = { x: s.x, y: s.y };
          }
          if (!arrow.endPct) return;
          arrow.startPct.x = clampMapPct(arrow.startPct.x + delta.x);
          arrow.startPct.y = clampMapPct(arrow.startPct.y + delta.y);
          arrow.endPct.x = clampMapPct(arrow.endPct.x + delta.x);
          arrow.endPct.y = clampMapPct(arrow.endPct.y + delta.y);
        }
        syncArrows();
      }
    }

    function onDragEnd(e) {
      if (!state.drag) return;
      var d = state.drag;
      if (d.mode === 'slot') {
        if (d.moved && d.slotButton) d.slotButton.dataset.suppressClick = '1';
        var inside = isInsideMapClient(e.clientX, e.clientY);
        if (d.moved) {
          if (inside) {
            setSlotMapPos(d.teamId, d.slotIndex, clientToMapPercent(e.clientX, e.clientY));
          } else {
            clearSlot(d.teamId, d.slotIndex);
          }
        }
      }
      if (d.mode === 'ability-tray') {
        if (d.moved && d.trayButton) d.trayButton.dataset.suppressClick = '1';
        var rectAb = dom.minimapContainer.getBoundingClientRect();
        var insideAb = e.clientX >= rectAb.left && e.clientX <= rectAb.right &&
          e.clientY >= rectAb.top && e.clientY <= rectAb.bottom;
        if (insideAb && d.moved) {
          getTeam(d.teamId).slots[d.slotIndex].abilityPlacements.push({
            id: genMapItemId('ab'),
            src: d.ability.src,
            label: d.ability.label,
            mapPos: clientToMapPercent(e.clientX, e.clientY)
          });
          syncMapScene();
        }
      }
      if (d.mode === 'marker') {
        if (d.moved) {
          if (isInsideMapClient(e.clientX, e.clientY)) clearMapMarkerFocus();
          else removeAgentFromMap(d.teamId, d.slotIndex);
        } else {
          toggleMapMarkerFocus(d.teamId, d.slotIndex);
        }
      }
      if (d.mode === 'ability-map') {
        if (d.moved) {
          if (!isInsideMapClient(e.clientX, e.clientY)) {
            removeAbilityFromMap(d.teamId, d.slotIndex, d.abilityId);
          } else {
            syncMapScene();
          }
        } else {
          setMapSelection({
            type: 'ability',
            teamId: d.teamId,
            slotIndex: d.slotIndex,
            abilityId: d.abilityId
          });
          syncMapScene();
        }
      }
      if (d.mode === 'arrow-draft') {
        if (d.moved && d.endPct && d.startPct) {
          state.arrows.push({
            id: genMapItemId('arr'),
            teamId: d.teamId,
            anchor: d.anchor,
            startPct: { x: d.startPct.x, y: d.startPct.y },
            endPct: { x: d.endPct.x, y: d.endPct.y }
          });
        }
      }
      endDrag();
    }

    function startSlotToMapDrag(e, teamId, slotIndex, slotButton) {
      e.preventDefault();
      var slot = getTeam(teamId).slots[slotIndex];
      if (!slot.agentId) return;

      var ghost = document.createElement('div');
      ghost.className = 'strategy-drag-ghost team-' + teamId;
      ghost.innerHTML = '<img src="' + agentIconSrc(slot.agentId) + '" alt="">';
      document.body.appendChild(ghost);
      ghost.style.left = e.clientX + 'px';
      ghost.style.top = e.clientY + 'px';

      state.drag = {
        mode: 'slot',
        teamId: teamId,
        slotIndex: slotIndex,
        ghost: ghost,
        slotButton: slotButton,
        startX: e.clientX,
        startY: e.clientY,
        moved: false
      };
      document.addEventListener('pointermove', onDragMove);
      document.addEventListener('pointerup', onDragEnd);
      document.addEventListener('pointercancel', onDragEnd);
    }

    function startMapMarkerDrag(e, teamId, slotIndex, groupEl) {
      e.preventDefault();
      var slot = getTeam(teamId).slots[slotIndex];
      if (!slot.agentId || !slot.mapPos) return;

      state.drag = {
        mode: 'marker',
        teamId: teamId,
        slotIndex: slotIndex,
        groupEl: groupEl,
        ghost: null,
        startX: e.clientX,
        startY: e.clientY,
        moved: false
      };
      if (e.currentTarget.setPointerCapture) {
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      document.addEventListener('pointermove', onDragMove);
      document.addEventListener('pointerup', onDragEnd);
      document.addEventListener('pointercancel', onDragEnd);
    }

    function startAbilityTrayDrag(e, teamId, slotIndex, ability, trayButton) {
      e.preventDefault();
      var slot = getTeam(teamId).slots[slotIndex];
      if (!slot.mapPos) return;

      var ghost = document.createElement('div');
      ghost.className = 'strategy-drag-ghost strategy-ability-ghost team-' + teamId;
      ghost.innerHTML = '<img src="' + ability.src + '" alt="">';
      document.body.appendChild(ghost);
      ghost.style.left = e.clientX + 'px';
      ghost.style.top = e.clientY + 'px';

      state.drag = {
        mode: 'ability-tray',
        teamId: teamId,
        slotIndex: slotIndex,
        ability: ability,
        trayButton: trayButton,
        ghost: ghost,
        startX: e.clientX,
        startY: e.clientY,
        moved: false
      };
      document.addEventListener('pointermove', onDragMove);
      document.addEventListener('pointerup', onDragEnd);
      document.addEventListener('pointercancel', onDragEnd);
    }

    function startAbilityMapDrag(e, teamId, slotIndex, abilityId, el) {
      e.preventDefault();
      state.drag = {
        mode: 'ability-map',
        teamId: teamId,
        slotIndex: slotIndex,
        abilityId: abilityId,
        el: el,
        startX: e.clientX,
        startY: e.clientY,
        moved: false
      };
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
      document.addEventListener('pointermove', onDragMove);
      document.addEventListener('pointerup', onDragEnd);
      document.addEventListener('pointercancel', onDragEnd);
    }

    function startArrowDraft(e, anchor, teamId) {
      var start = getAnchorMapPct(anchor);
      if (!start) return;

      ensureArrowDefs();
      var preview = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      preview.setAttribute('class', 'strategy-arrow-line strategy-arrow-preview');
      preview.setAttribute('x1', start.x);
      preview.setAttribute('y1', start.y);
      preview.setAttribute('x2', start.x);
      preview.setAttribute('y2', start.y);
      preview.setAttribute('stroke', teamId === 'blue' ? '#5dade2' : '#ec7063');
      preview.setAttribute('marker-end', 'url(#strategyArrowHead)');
      dom.arrowSvg.appendChild(preview);

      state.drag = {
        mode: 'arrow-draft',
        teamId: teamId,
        anchor: anchor,
        startPct: { x: start.x, y: start.y },
        endPct: { x: start.x, y: start.y },
        previewLine: preview,
        startX: e.clientX,
        startY: e.clientY,
        moved: false
      };
      document.addEventListener('pointermove', onDragMove);
      document.addEventListener('pointerup', onDragEnd);
      document.addEventListener('pointercancel', onDragEnd);
    }

    function startArrowMove(e, arrowId) {
      var arrow = state.arrows.find(function(a) { return a.id === arrowId; });
      if (!arrow) return;
      detachArrowIfAnchored(arrow);
      state.drag = {
        mode: 'arrow-move',
        arrowId: arrowId,
        startX: e.clientX,
        startY: e.clientY,
        lastPct: clientToMapPercent(e.clientX, e.clientY),
        moved: false
      };
      document.addEventListener('pointermove', onDragMove);
      document.addEventListener('pointerup', onDragEnd);
      document.addEventListener('pointercancel', onDragEnd);
    }

    function startArrowEndDrag(e, arrowId) {
      var arrow = state.arrows.find(function(a) { return a.id === arrowId; });
      if (!arrow) return;
      detachArrowIfAnchored(arrow);
      state.drag = {
        mode: 'arrow-end',
        arrowId: arrowId,
        startX: e.clientX,
        startY: e.clientY,
        lastPct: clientToMapPercent(e.clientX, e.clientY),
        moved: false
      };
      document.addEventListener('pointermove', onDragMove);
      document.addEventListener('pointerup', onDragEnd);
      document.addEventListener('pointercancel', onDragEnd);
    }

    function getStrategyExportFilename() {
      var map = (state.mapName || 'Map').replace(/[^\w\-]+/g, '_');
      return 'SpikeCoach_' + map + '_Strategy.png';
    }

    function serializeStrategy() {
      return {
        version: 1,
        mapName: state.mapName,
        teams: state.teams,
        arrows: state.arrows
      };
    }

    function exportStrategyBoardPNG() {
      if (!dom.exportRoot) return;
      if (typeof html2canvas !== 'function') {
        window.alert('Export is unavailable. html2canvas did not load.');
        return;
      }
      if (!state.mapName) return;

      var btn = dom.downloadBtn;
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Exporting…';
      }

      html2canvas(dom.exportRoot, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
        logging: false
      }).then(function(canvas) {
        canvas.toBlob(function(blob) {
          if (!blob) throw new Error('PNG export failed');
          var url = URL.createObjectURL(blob);
          var link = document.createElement('a');
          link.href = url;
          link.download = getStrategyExportFilename();
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
        }, 'image/png');
      }).catch(function(err) {
        console.error('Strategy export failed:', err);
        window.alert('Could not export strategy. Try again after the map finishes loading.');
      }).finally(function() {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Download Strategy';
        }
      });
    }

    function openMap(mapName) {
      state.mapName = mapName;
      resetTeams();
      dom.analyzeContainer.style.display = 'none';
      dom.minimapView.style.display = 'block';
      dom.mapTitle.textContent = mapName;
      dom.minimapImage.src = 'Map_minimaps/' + mapName + '_minimap.webp';
      closeAgentPicker();
      renderAllSlots();
    }

    function closeMap() {
      dom.minimapView.style.display = 'none';
      dom.analyzeContainer.style.display = 'block';
      closeAgentPicker();
      endDrag();
    }

    function bindMapSelector() {
      dom.mapItems.forEach(function(item) {
        item.addEventListener('click', function() {
          openMap(this.dataset.map);
        });
      });
      if (dom.backBtn) dom.backBtn.addEventListener('click', closeMap);
    }

    function bindPicker() {
      dom.pickerClose.addEventListener('click', closeAgentPicker);
      dom.pickerBackdrop.addEventListener('click', closeAgentPicker);
      dom.pickerRemove.addEventListener('click', function() {
        if (state.picker.teamId === null) return;
        clearSlot(state.picker.teamId, state.picker.slotIndex);
      });
    }

    function init() {
      dom.analyzeContainer = document.querySelector('#strategySection .strategy-maps-container');
      dom.minimapView = document.getElementById('analyzeMinimapView');
      dom.backBtn = document.getElementById('backToAnalyzeList');
      dom.mapItems = document.querySelectorAll('#analyzeMapsGrid .map-card');
      dom.minimapContainer = document.getElementById('strategyExportRoot');
      dom.exportRoot = dom.minimapContainer;
      dom.downloadBtn = document.getElementById('strategyDownloadBtn');
      dom.minimapImage = document.getElementById('minimapImage');
      dom.mapTitle = document.getElementById('analyzeMapTitle');
      dom.mapLayer = document.getElementById('strategyMapLayer');
      dom.entitiesLayer = document.getElementById('strategyEntitiesLayer');
      dom.arrowSvg = document.getElementById('strategyArrowSvg');
      dom.blueSlots = document.getElementById('strategyBlueSlots');
      dom.redSlots = document.getElementById('strategyRedSlots');
      dom.picker = document.getElementById('strategyAgentPicker');
      dom.pickerBackdrop = document.getElementById('strategyAgentPickerBackdrop');
      dom.pickerClose = document.getElementById('strategyAgentPickerClose');
      dom.pickerRemove = document.getElementById('strategyAgentRemoveBtn');
      dom.pickerGrid = document.getElementById('strategyAgentPickerGrid');
      dom.pickerTitle = document.getElementById('strategyAgentPickerTitle');

      layers.markers = dom.entitiesLayer;
      layers.abilities = dom.entitiesLayer;
      layers.arrows = dom.arrowSvg;

      dom.mapLayer.addEventListener('contextmenu', function(e) { e.preventDefault(); });
      dom.minimapContainer.addEventListener('contextmenu', function(e) { e.preventDefault(); });

      dom.mapLayer.addEventListener('pointerdown', function(e) {
        if (e.target === dom.mapLayer || e.target === dom.entitiesLayer || e.target === dom.arrowSvg) {
          clearMapMarkerFocus();
        }
      });
      dom.minimapContainer.addEventListener('pointerdown', function(e) {
        if (e.target === dom.minimapImage) clearMapMarkerFocus();
      });

      if (dom.downloadBtn) {
        dom.downloadBtn.addEventListener('click', exportStrategyBoardPNG);
      }

      document.addEventListener('keydown', function(e) {
        if (!dom.minimapView || dom.minimapView.style.display === 'none') return;
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        if (isEditableTarget(document.activeElement)) return;
        if (!state.mapSelection) return;
        e.preventDefault();
        deleteSelectedMapItem();
      });

      resetTeams();
      bindMapSelector();
      bindPicker();
    }

    return {
      init: init,
      openMap: openMap,
      showMapPicker: closeMap,
      exportStrategyBoardPNG: exportStrategyBoardPNG,
      serializeStrategy: serializeStrategy,
      layers: layers,
      getState: function() { return state; }
    };
  })();

  StrategyPlanner.init();

  // AI Chat functionality
  var aiChatMessages = document.getElementById('aiChatMessages');
  var aiChatInput = document.getElementById('aiChatInput');
  var aiChatSend = document.getElementById('aiChatSend');

  function escapeChatHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatInlineMarkdown(s) {
    return s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  // Input must be escaped before inline formatting so model output can't inject HTML.
  function renderBotMarkdown(text) {
    var lines = escapeChatHtml(text.replace(/\r\n/g, '\n')).split('\n');
    var html = '';
    var listType = null;

    function closeList() {
      if (listType) { html += '</' + listType + '>'; listType = null; }
    }

    lines.forEach(function(rawLine) {
      var line = rawLine.trim();
      var bullet = line.match(/^[-*•]\s+(.*)$/);
      var numbered = line.match(/^\d+[.)]\s+(.*)$/);
      var heading = line.match(/^#{1,6}\s+(.*)$/);

      if (bullet || numbered) {
        var type = bullet ? 'ul' : 'ol';
        if (listType !== type) { closeList(); html += '<' + type + '>'; listType = type; }
        html += '<li>' + formatInlineMarkdown((bullet || numbered)[1]) + '</li>';
        return;
      }

      closeList();
      if (!line) return;
      if (heading) {
        html += '<p><strong>' + formatInlineMarkdown(heading[1].replace(/\*\*/g, '')) + '</strong></p>';
      } else {
        html += '<p>' + formatInlineMarkdown(line) + '</p>';
      }
    });

    closeList();
    return html;
  }

  function addChatMessage(text, isUser) {
    var msgDiv = document.createElement('div');
    msgDiv.className = isUser ? 'ai-msg ai-msg-user' : 'ai-msg ai-msg-bot';
    if (isUser) {
      msgDiv.textContent = text;
    } else {
      msgDiv.innerHTML = renderBotMarkdown(text);
    }
    aiChatMessages.appendChild(msgDiv);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  }

  function showTyping() {
    var typing = document.createElement('div');
    typing.className = 'ai-msg ai-msg-bot ai-typing';
    typing.id = 'aiTyping';
    typing.innerHTML = '<span></span><span></span><span></span>';
    aiChatMessages.appendChild(typing);
    aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
  }

  function removeTyping() {
    var typing = document.getElementById('aiTyping');
    if (typing) typing.remove();
  }

  function getSpikeCoachIdToken() {
    var auth = window.firebaseAuth;
    if (!auth) return Promise.resolve(null);
    if (auth.currentUser && auth.currentUser.getIdToken) {
      return auth.currentUser.getIdToken().catch(function () { return null; });
    }
    if (!window.onAuthStateChanged) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var unsubscribe = window.onAuthStateChanged(function (user) {
        if (typeof unsubscribe === 'function') unsubscribe();
        if (!user || !user.getIdToken) {
          resolve(null);
          return;
        }
        user.getIdToken().then(resolve).catch(function () { resolve(null); });
      });
    });
  }

  async function sendAiMessage() {
    var message = aiChatInput.value.trim();
    if (!message) return;
    if (message.length > 250) {
      addChatMessage('Please keep messages to 250 characters or fewer.', false);
      return;
    }

    addChatMessage(message, true);
    aiChatInput.value = '';
    aiChatSend.disabled = true;
    aiChatInput.disabled = true;
    showTyping();

    var chatUrl = 'http://127.0.0.1:3000/api/chat';
    try {
      var headers = { 'Content-Type': 'application/json' };
      var chatToken = await getSpikeCoachIdToken();
      if (chatToken) headers.Authorization = 'Bearer ' + chatToken;
      console.log('[SpikeCoach Chat] POST', chatUrl, 'authorization:', !!chatToken);
      var response = await fetch(chatUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ message: message })
      });
      console.log('[SpikeCoach Chat] status', response.status);
      var data = await response.json();
      removeTyping();
      addChatMessage(data.response || data.error || 'Error getting response.', false);
    } catch (error) {
      console.log('[SpikeCoach Chat] request failed', error && error.name ? error.name : 'Error');
      removeTyping();
      addChatMessage('Cannot connect to server. Run: npm run start-server', false);
    }

    aiChatSend.disabled = false;
    aiChatInput.disabled = false;
    aiChatInput.focus();
  }

  if (aiChatSend) {
    aiChatSend.addEventListener('click', sendAiMessage);
  }

  if (aiChatInput) {
    aiChatInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendAiMessage();
      }
    });
  }
}

function showProfileOverlay() {
  var userEmail = '';
  var userInitial = 'U';
  var userName = 'TestUser';
  
  try {
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
      userEmail = window.firebaseAuth.currentUser.email || '';
      if (userEmail && userEmail.length > 0) {
        userInitial = userEmail.charAt(0).toUpperCase();
      }
    }
    // Retrieve username from localStorage
    var storedUsername = localStorage.getItem('spikecoach_username');
    if (storedUsername) {
      userName = storedUsername;
      userInitial = userName.charAt(0).toUpperCase();
    }
  } catch (e) {}
  
  // Create overlay HTML
  var overlayHTML = `
    <div class="profile-overlay-backdrop" id="profileOverlayBackdrop">
      <div class="profile-overlay-container" id="profileOverlayContainer">
        <div class="profile-overlay-sidebar">
          <div class="profile-overlay-sidebar-header">
            <div class="profile-circle-large">${userInitial}</div>
            <div class="profile-overlay-username">${userName}</div>
            <div class="profile-overlay-email">${userEmail || 'user@example.com'}</div>
          </div>
          <div class="profile-overlay-nav">
            <div class="profile-overlay-nav-item active" data-section="profile">
              <span class="nav-icon">👤</span>
              <span>Profile</span>
            </div>
            <div class="profile-overlay-nav-item" data-section="settings">
              <span class="nav-icon">⚙️</span>
              <span>Settings</span>
            </div>
            <div class="profile-overlay-nav-item" data-section="help">
              <span class="nav-icon">❓</span>
              <span>Help</span>
            </div>
          </div>
        </div>
        <div class="profile-overlay-content">
          <button class="profile-overlay-close" id="profileOverlayClose">✕</button>
          <div class="profile-overlay-section active" id="profileSection">
            <h2 class="profile-overlay-title">Profile</h2>
            
            <!-- Profile Picture Section -->
            <div class="profile-picture-section">
              <div class="profile-picture-preview">
                <div class="profile-circle-xlarge" id="profilePicPreview">${userInitial}</div>
              </div>
              <button class="profile-edit-btn" id="changeProfilePicBtn">Change Profile Picture</button>
            </div>
            
            <div class="profile-info-grid">
              <div class="profile-info-item editable-item">
                <label class="profile-info-label">Email</label>
                <div class="profile-info-value">${userEmail || 'user@example.com'}</div>
              </div>
              <div class="profile-info-item editable-item">
                <label class="profile-info-label">Username</label>
                <div class="profile-info-value" id="usernameDisplay">${userName}</div>
                <button class="profile-edit-icon-btn" id="editUsernameBtn" title="Edit Username">✎</button>
              </div>
              <div class="profile-info-item">
                <label class="profile-info-label">Account Type</label>
                <div class="profile-info-value">Free</div>
              </div>
              <div class="profile-info-item">
                <label class="profile-info-label">Member Since</label>
                <div class="profile-info-value">November 2025</div>
              </div>
            </div>
          </div>
          <div class="profile-overlay-section" id="settingsSection">
            <h2 class="profile-overlay-title">Settings</h2>
            <p class="profile-placeholder-text">Settings will be available soon...</p>
          </div>
          <div class="profile-overlay-section" id="helpSection">
            <h2 class="profile-overlay-title">Help</h2>
            <p class="profile-placeholder-text">Help resources will be available soon...</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Append overlay to body
  document.body.insertAdjacentHTML('beforeend', overlayHTML);
  
  // Get elements
  var backdrop = document.getElementById('profileOverlayBackdrop');
  var container = document.getElementById('profileOverlayContainer');
  var closeBtn = document.getElementById('profileOverlayClose');
  var navItems = document.querySelectorAll('.profile-overlay-nav-item');
  var sections = document.querySelectorAll('.profile-overlay-section');
  
  // Close overlay when clicking backdrop (not the container)
  backdrop.addEventListener('click', function(e) {
    if (e.target === backdrop) {
      closeProfileOverlay();
    }
  });
  
  // Close overlay when clicking close button
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      closeProfileOverlay();
    });
  }
  
  // Handle navigation
  navItems.forEach(function(item) {
    item.addEventListener('click', function() {
      var targetSection = this.getAttribute('data-section');
      
      // Remove active class from all nav items and sections
      navItems.forEach(function(nav) { nav.classList.remove('active'); });
      sections.forEach(function(section) { section.classList.remove('active'); });
      
      // Add active class to clicked nav item and corresponding section
      this.classList.add('active');
      document.getElementById(targetSection + 'Section').classList.add('active');
    });
  });
  
  // Handle username editing
  var editUsernameBtn = document.getElementById('editUsernameBtn');
  var usernameDisplay = document.getElementById('usernameDisplay');
  if (editUsernameBtn && usernameDisplay) {
    editUsernameBtn.addEventListener('click', function() {
      var currentUsername = usernameDisplay.textContent;
      var input = document.createElement('input');
      input.type = 'text';
      input.value = currentUsername;
      input.className = 'profile-edit-input';
      input.id = 'usernameInput';
      
      var btnContainer = document.createElement('div');
      btnContainer.className = 'profile-edit-btn-container';
      
      var saveBtn = document.createElement('button');
      saveBtn.textContent = '✓';
      saveBtn.className = 'profile-save-btn';
      saveBtn.title = 'Save';
      
      var cancelBtn = document.createElement('button');
      cancelBtn.textContent = '✕';
      cancelBtn.className = 'profile-cancel-btn';
      cancelBtn.title = 'Cancel';
      
      btnContainer.appendChild(saveBtn);
      btnContainer.appendChild(cancelBtn);
      
      // Replace display with input
      usernameDisplay.style.display = 'none';
      editUsernameBtn.style.display = 'none';
      usernameDisplay.parentNode.appendChild(input);
      usernameDisplay.parentNode.appendChild(btnContainer);
      input.focus();
      input.select();
      
      function saveUsername() {
        var newUsername = input.value.trim();
        if (newUsername && newUsername !== '') {
          localStorage.setItem('spikecoach_username', newUsername);
          usernameDisplay.textContent = newUsername;
          
          // Update all username displays
          var dropdownUsername = document.querySelector('.dropdown-username');
          if (dropdownUsername) dropdownUsername.textContent = newUsername;
          
          var overlayUsername = document.querySelector('.profile-overlay-username');
          if (overlayUsername) overlayUsername.textContent = newUsername;
          
          // Update initials
          var newInitial = newUsername.charAt(0).toUpperCase();
          var profileCircles = document.querySelectorAll('.profile-circle, .profile-circle-large, .profile-circle-xlarge');
          profileCircles.forEach(function(circle) {
            circle.textContent = newInitial;
          });
        }
        cleanup();
      }
      
      function cleanup() {
        input.remove();
        btnContainer.remove();
        usernameDisplay.style.display = '';
        editUsernameBtn.style.display = '';
      }
      
      saveBtn.addEventListener('click', saveUsername);
      cancelBtn.addEventListener('click', cleanup);
      
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveUsername();
        } else if (e.key === 'Escape') {
          cleanup();
        }
      });
    });
  }
  
  // Handle profile picture change
  var changeProfilePicBtn = document.getElementById('changeProfilePicBtn');
  if (changeProfilePicBtn) {
    changeProfilePicBtn.addEventListener('click', function() {
      showProfilePictureModal();
    });
  }
  
  // Apply saved profile color
  var savedColor = localStorage.getItem('spikecoach_profile_color');
  if (savedColor) {
    applyProfileColor(savedColor);
  }
  
  // Animate in
  setTimeout(function() {
    backdrop.classList.add('show');
  }, 10);
}

function showProfilePictureModal() {
  var currentColor = localStorage.getItem('spikecoach_profile_color') || 'default';
  
  var modalHTML = `
    <div class="profile-pic-modal-backdrop" id="profilePicModalBackdrop">
      <div class="profile-pic-modal">
        <h3 class="profile-pic-modal-title">Choose Profile Color</h3>
        <div class="profile-color-grid">
          <div class="profile-color-option ${currentColor === 'default' ? 'selected' : ''}" data-color="default" style="background: linear-gradient(135deg, #ff6b78, #ff4655);">
            <span class="color-check">✓</span>
          </div>
          <div class="profile-color-option ${currentColor === 'blue' ? 'selected' : ''}" data-color="blue" style="background: linear-gradient(135deg, #4facfe, #00f2fe);">
            <span class="color-check">✓</span>
          </div>
          <div class="profile-color-option ${currentColor === 'purple' ? 'selected' : ''}" data-color="purple" style="background: linear-gradient(135deg, #a855f7, #6366f1);">
            <span class="color-check">✓</span>
          </div>
          <div class="profile-color-option ${currentColor === 'green' ? 'selected' : ''}" data-color="green" style="background: linear-gradient(135deg, #34d399, #10b981);">
            <span class="color-check">✓</span>
          </div>
          <div class="profile-color-option ${currentColor === 'orange' ? 'selected' : ''}" data-color="orange" style="background: linear-gradient(135deg, #fb923c, #f97316);">
            <span class="color-check">✓</span>
          </div>
          <div class="profile-color-option ${currentColor === 'pink' ? 'selected' : ''}" data-color="pink" style="background: linear-gradient(135deg, #f472b6, #ec4899);">
            <span class="color-check">✓</span>
          </div>
          <div class="profile-color-option ${currentColor === 'yellow' ? 'selected' : ''}" data-color="yellow" style="background: linear-gradient(135deg, #fbbf24, #f59e0b);">
            <span class="color-check">✓</span>
          </div>
          <div class="profile-color-option ${currentColor === 'teal' ? 'selected' : ''}" data-color="teal" style="background: linear-gradient(135deg, #2dd4bf, #14b8a6);">
            <span class="color-check">✓</span>
          </div>
        </div>
        <div class="profile-pic-modal-actions">
          <button class="profile-modal-btn profile-modal-save" id="saveProfileColor">Save</button>
          <button class="profile-modal-btn profile-modal-cancel" id="cancelProfileColor">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  var modalBackdrop = document.getElementById('profilePicModalBackdrop');
  var colorOptions = document.querySelectorAll('.profile-color-option');
  var saveBtn = document.getElementById('saveProfileColor');
  var cancelBtn = document.getElementById('cancelProfileColor');
  var selectedColor = currentColor;
  
  colorOptions.forEach(function(option) {
    option.addEventListener('click', function() {
      colorOptions.forEach(function(opt) { opt.classList.remove('selected'); });
      this.classList.add('selected');
      selectedColor = this.getAttribute('data-color');
    });
  });
  
  function closeModal() {
    modalBackdrop.classList.remove('show');
    setTimeout(function() {
      modalBackdrop.remove();
    }, 300);
  }
  
  saveBtn.addEventListener('click', function() {
    localStorage.setItem('spikecoach_profile_color', selectedColor);
    applyProfileColor(selectedColor);
    closeModal();
  });
  
  cancelBtn.addEventListener('click', closeModal);
  
  modalBackdrop.addEventListener('click', function(e) {
    if (e.target === modalBackdrop) {
      closeModal();
    }
  });
  
  setTimeout(function() {
    modalBackdrop.classList.add('show');
  }, 10);
}

function applyProfileColor(color) {
  var gradients = {
    'default': 'linear-gradient(135deg, #ff6b78, #ff4655)',
    'blue': 'linear-gradient(135deg, #4facfe, #00f2fe)',
    'purple': 'linear-gradient(135deg, #a855f7, #6366f1)',
    'green': 'linear-gradient(135deg, #34d399, #10b981)',
    'orange': 'linear-gradient(135deg, #fb923c, #f97316)',
    'pink': 'linear-gradient(135deg, #f472b6, #ec4899)',
    'yellow': 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    'teal': 'linear-gradient(135deg, #2dd4bf, #14b8a6)'
  };
  
  var gradient = gradients[color] || gradients['default'];
  var profileCircles = document.querySelectorAll('.profile-circle, .profile-circle-large, .profile-circle-xlarge');
  
  profileCircles.forEach(function(circle) {
    circle.style.background = gradient;
  });
}

function closeProfileOverlay() {
  var backdrop = document.getElementById('profileOverlayBackdrop');
  if (backdrop) {
    backdrop.classList.remove('show');
    setTimeout(function() {
      backdrop.remove();
    }, 300); // Wait for animation to complete
  }
}

function showGoodbyeAnimation() {
  document.body.innerHTML = `
    <div class="welcome-container">
      <h1 id="goodbyeText" class="welcome-text"></h1>
    </div>
  `;
  
  var goodbyeText = document.getElementById('goodbyeText');
  var text = "Farewell";
  var index = 0;
  
  if (window.gsap && goodbyeText) {
    // Typewriter effect
    function typeChar() {
      if (index < text.length) {
        goodbyeText.textContent += text.charAt(index);
        index++;
        setTimeout(typeChar, 80); // Speed of typing (slightly faster than welcome)
      } else {
        // After typing is complete, wait a moment, then animate off screen and show get started
        setTimeout(function() {
          var tl = gsap.timeline({
            onComplete: function() {
              showGetStartedScreen();
            }
          });
          
          // Animate off screen (move up and fade out)
          tl.to('#goodbyeText', {
            duration: 0.6,
            y: -100,
            opacity: 0,
            ease: 'power2.in'
          });
        }, 1200); // Longer pause after typing completes
      }
    }
    
    // Start with text visible and centered
    gsap.set('#goodbyeText', {
      opacity: 1,
      y: 0
    });
    
    // Start typing animation
    typeChar();
  } else {
    // Fallback if GSAP is not available
    goodbyeText.textContent = text;
    setTimeout(function() {
      showGetStartedScreen();
    }, 3000);
  }
}

function animateOnboarding() {
  if (!window.gsap) return;
  var tl = gsap.timeline();
  tl.from('.onboarding-card', {duration:0.5, scale:0.95, opacity:0, ease:'power2.out'})
    .from('.onboarding-title', {duration:0.4, y:-20, opacity:0, ease:'power2.out'}, '-=0.3')
    .from('.onboarding-subtitle', {duration:0.4, y:-10, opacity:0, ease:'power2.out'}, '-=0.25')
    .from('.onboarding-image-placeholder', {duration:0.4, scale:0.9, opacity:0, ease:'power2.out'}, '-=0.2')
    .from('.onboarding-btn', {duration:0.4, y:10, opacity:0, ease:'back.out(1.2)'}, '-=0.2');
  // Arrows remain always visible - no animation for them
}

window.addEventListener('DOMContentLoaded', function() {
  // Immediately hide animation elements off-screen before GSAP initializes
  var topEls = document.querySelectorAll('.top-horizontal-text .reveal-inner');
  var bottomEls = document.querySelectorAll('.bottom-horizontal-text .reveal-inner');
  
  topEls.forEach(function(el) {
    if (el && el.style) {
      el.style.transform = 'translateX(' + (window.innerWidth + (el.offsetWidth || 1000)) + 'px)';
    }
  });
  
  bottomEls.forEach(function(el) {
    if (el && el.style) {
      el.style.transform = 'translateX(-' + (window.innerWidth + (el.offsetWidth || 1000)) + 'px)';
    }
  });
  
  var btn = document.getElementById('getStartedBtn');
  if (btn) {
    btn.addEventListener('click', showGetStartedScreen);
  }
  try {
    if (window.overwolf && overwolf.extensions && overwolf.extensions.current && overwolf.extensions.current.getManifest) {
      overwolf.extensions.current.getManifest(function(result) {
        var LOG = '[SpikeCoach Manifest Debug]';
        var ok = !!(result && result.success);
        console.log(LOG, 'success:', ok);
        if (!ok) {
          return;
        }
        var manifest = (result && result.object) ? result.object : result;
        var meta = manifest && manifest.meta;
        var data = manifest && manifest.data;
        console.log(LOG, 'meta.version:', meta ? meta.version : undefined);
        console.log(LOG, 'data.game_events:', data ? data.game_events : undefined);
        console.log(LOG, 'data.game_targeting:', data ? data.game_targeting : undefined);
      });
    }
    if (window.overwolf && overwolf.windows) {
      try {
        overwolf.windows.getCurrentWindow(function(result) {
          if (result && result.window && result.window.id) {
            overwolf.windows.maximize(result.window.id, function() {});
          }
        });
      } catch (owErr) {
      }
    } else {
      var w = window.screen.availWidth;
      var h = window.screen.availHeight;
      window.moveTo(0, 0);
      window.resizeTo(w, h);
    }
  } catch (e) {
  }
});

function animateLanding() {
  if (!window.gsap) return;
  var tl = gsap.timeline();
  tl.from(['.header img', '.header h1', 'p', '#getStartedBtn'], {
    duration: 1.2,
    x: 120,
    opacity: 0,
    ease: 'power3.out'
  }, 0);
}

function animateLoginElements() {
  if (!window.gsap) return;
  var tl = gsap.timeline();
  tl.from('.login-form', {duration:0.45, scale:0.98, opacity:0, y:8, ease:'power2.out'})
    .from('.login-form h2', {duration:0.35, y:-6, opacity:0, ease:'power2.out'}, '-=0.35')
    .from('.login-input', {duration:0.28, y:6, opacity:0, stagger:0.05, ease:'power2.out'}, '-=0.25')
    .from('.signup-btn', {duration:0.28, y:4, opacity:0, ease:'power2.out'}, '-=0.18');
}

window.addEventListener('load', function() {
  showTestingScreen();
});

function showTestingScreen() {
  document.body.innerHTML = `
    <div class="testing-screen">
      <div class="testing-card">
        <h1 class="testing-title">Testing Mode</h1>
        <div class="testing-buttons">
          <button id="skipToProductBtn" class="testing-btn testing-btn-primary">
            Skip to Product Page
          </button>
          <button id="fullFlowBtn" class="testing-btn testing-btn-secondary">
            Full Animation Flow
          </button>
        </div>
      </div>
    </div>
  `;
  
  var skipBtn = document.getElementById('skipToProductBtn');
  var fullFlowBtn = document.getElementById('fullFlowBtn');
  
  if (skipBtn) {
    skipBtn.addEventListener('click', function() {
      showMainApp();
    });
  }
  
  if (fullFlowBtn) {
    fullFlowBtn.addEventListener('click', function() {
      // Restore original landing page HTML and start the animation flow
      restoreLandingPage();
    });
  }
}

function restoreLandingPage() {
  document.body.innerHTML = `
    <div class="landing-page">
      <div class="top-horizontal-text">
        <div class="vertical-text-shadow"><span class="reveal"><span class="reveal-inner">UNLOCK<br>YOUR AIM</span></span></div>
        <div class="vertical-text-shadow"><span class="reveal"><span class="reveal-inner">UNLOCK<br>YOUR AIM</span></span></div>
        <div class="vertical-text-shadow"><span class="reveal"><span class="reveal-inner">UNLOCK<br>YOUR AIM</span></span></div>
        <div class="vertical-text-shadow"><span class="reveal"><span class="reveal-inner">UNLOCK<br>YOUR AIM</span></span></div>
        <div class="vertical-text-shadow"><span class="reveal"><span class="reveal-inner">UNLOCK<br>YOUR AIM</span></span></div>
        <div class="vertical-text-main"><span class="reveal"><span class="reveal-inner">UNLOCK<br>YOUR AIM</span></span></div>
      </div>

      <div class="center-content">
        <div class="header">
          <img src="spikecoach_emblem.png" alt="SPIKECOACH">
          <h1>SpikeCoach</h1>
        </div>
        <p>AI Valorant Coaching that helps you master strategy, aim, and decision-making.</p>
        <button id="getStartedBtn" class="primary-btn">Get Started</button>
      </div>

      <div class="bottom-horizontal-text">
        <div class="vertical-text-shadow"><span class="reveal"><span class="reveal-inner">RAISE<br>YOUR GAME</span></span></div>
        <div class="vertical-text-shadow"><span class="reveal"><span class="reveal-inner">RAISE<br>YOUR GAME</span></span></div>
        <div class="vertical-text-shadow"><span class="reveal"><span class="reveal-inner">RAISE<br>YOUR GAME</span></span></div>
        <div class="vertical-text-shadow"><span class="reveal"><span class="reveal-inner">RAISE<br>YOUR GAME</span></span></div>
        <div class="vertical-text-shadow"><span class="reveal"><span class="reveal-inner">RAISE<br>YOUR GAME</span></span></div>
        <div class="vertical-text-main"><span class="reveal"><span class="reveal-inner">RAISE<br>YOUR GAME</span></span></div>
      </div>
    </div>
  `;
  
  // Re-attach the Get Started button handler
  var btn = document.getElementById('getStartedBtn');
  if (btn) {
    btn.addEventListener('click', showGetStartedScreen);
  }
  
  // Start the intro animation sequence
  orchestrateIntroSequence();
}

// Listen for Firebase auth state changes and update UI automatically when available
if (window.onAuthStateChanged) {
  window.onAuthStateChanged(function(user) {
    if (user) {
      // user signed in -> show logged in UI
      showLoggedInScreen();
    }
  });
}

function orchestrateIntroSequence() {
  if (!window.gsap) {
    animateLanding();
    return;
  }
  // Adaptive, eased animation across the full horizontal plane
  var topEls = gsap.utils.toArray('.top-horizontal-text .reveal-inner');
  var bottomEls = gsap.utils.toArray('.bottom-horizontal-text .reveal-inner');
  gsap.set('.center-content', {autoAlpha: 0, pointerEvents: 'none'});
  gsap.set('#getStartedBtn', {autoAlpha: 0, pointerEvents: 'none'});

  // position elements fully off-screen using pixel values so they travel the whole plane
  topEls.forEach(function(el) { gsap.set(el, {x: (window.innerWidth + el.offsetWidth) }); });
  bottomEls.forEach(function(el) { gsap.set(el, {x: -(window.innerWidth + el.offsetWidth) }); });

  function computeDuration(el) {
    // base duration scales with travel distance; keeps motion proportional on very wide screens
    var distance = window.innerWidth + el.offsetWidth;
    var ratio = distance / window.innerWidth; // ~1.0-1.4 typically
    var base = 0.95; // base seconds for typical viewport (reduced from 1.4 to speed up animation)
    var dur = base * ratio;
    // clamp to keep things reasonable
    return Math.max(0.7, Math.min(2.0, dur));
  }

  var tl = gsap.timeline();
  // Top group: enter (eased), brief hold, then exit (eased)
  tl.to(topEls, {
    x: 0,
    duration: function(i, el) { return computeDuration(el); },
    ease: 'power3.out',
    stagger: 0.03
  })
  .to({}, {duration: 0.01}) // minimal pause at center
  .to(topEls, {
    x: function(i, el) { return -(window.innerWidth + el.offsetWidth); },
    duration: function(i, el) { return computeDuration(el) * 0.75; },
    ease: 'power3.in',
    stagger: 0.025
  }, '+=0.01')
  // Bottom group: start slightly overlapping the top exit for a natural flow
  .to(bottomEls, {
    x: 0,
    duration: function(i, el) { return computeDuration(el); },
    ease: 'power3.out',
    stagger: 0.03
  }, '-=0.8')
  .to({}, {duration: 0.01})
  .to(bottomEls, {
    x: function(i, el) { return (window.innerWidth + el.offsetWidth); },
    duration: function(i, el) { return computeDuration(el) * 0.75; },
    ease: 'power3.in',
    stagger: 0.025
  }, '+=0.01')
  // Reveal main UI after a minimal delay
  .to('.center-content', {duration: 0.4, autoAlpha: 1, pointerEvents: 'auto', ease: 'power2.out'}, '+=0.05')
  .to('#getStartedBtn', {duration: 0.35, autoAlpha: 1, pointerEvents: 'auto', ease: 'back.out(1.2)'}, '+=0.03');
}
