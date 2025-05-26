
        // Initialize Supabase client
        const supabaseUrl = 'https://hccoowqiswclssmtfbyw.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjY29vd3Fpc3djbHNzbXRmYnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1Njg1NDQsImV4cCI6MjA2MzE0NDU0NH0.RB-9aB6FwyCUMg98Y6N3rx5w5Te8IvwrwxOx92lpKP0';
        let supabase = null;
        let dataCollectionEnabled = false; // Consent flag

        function initializeSupabaseIfNeeded() {
            if (!supabase) {
                supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
                console.log('[Supabase] Client initialized.');
            } else {
                console.log('[Supabase] Client already exists, not re-initializing.');
            }
        }

        // Function to generate a UUID
        function generateUUID() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        // Check for existing consent when page loads
        document.addEventListener('DOMContentLoaded', function() {
            const hasConsent = localStorage.getItem('userConsent');
            let visitorId = localStorage.getItem('visitor_id');
            console.log('[Consent Check] Consent status:', hasConsent);
            console.log('[Visitor] Looking for visitor_id...');
            if (visitorId) {
                console.log('[Visitor] visitor_id found!');
            } else {
                console.log('[Visitor] visitor_id not found, will create if needed.');
            }
            
            if (hasConsent === 'accepted') {
                initializeSupabaseIfNeeded();
                console.log('[Consent Check] Consent previously accepted. Initializing Supabase and visitor.');
                document.getElementById('consentBanner').classList.add('hidden');
                // Ensure UUID exists and create visitor record if needed
                if (!visitorId) {
                    console.log('[Visitor] visitor_id not found, creating...');
                    visitorId = generateUUID();
                    localStorage.setItem('visitor_id', visitorId);
                    console.log('[Visitor] visitor_id created successfully!');
                    createVisitorRecord(visitorId);
                }
            } else if (hasConsent === 'rejected') {
                console.log('[Consent Check] Consent previously rejected. Data collection disabled.');
                document.getElementById('consentBanner').classList.add('hidden');
                supabase = null;
                disableContactForm("Contact form is disabled because data collection was rejected. Please accept data collection in the privacy policy if you'd like to send a message.");
            } else {
                console.log('[Consent Check] No existing consent. Waiting for user action.');
            }
        });

        async function createVisitorRecord(visitorId) {
            // Remove detailed object log for privacy
            // console.log('[Visitor] createVisitorRecord called with:', visitorId, supabase);
            if (!supabase) {
                console.warn('[Visitor] Supabase not initialized, cannot create visitor record.');
                return;
            }
            // Get timezone info
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            let locationInfo = {
                timezone: timezone,
                continent: timezone.split('/')[0],
                country: timezone.split('/')[1],
                city: timezone.split('/')[2] || 'Unknown'
            };
            // Create visitor in database
            const { error } = await supabase
                .from('visitors')
                .insert({
                    id: visitorId,
                    location: locationInfo,
                    user_agent: navigator.userAgent,
                    language: navigator.language
                });
            if (error) {
                console.error('[Visitor] Error creating visitor in Supabase:', error);
            } else {
                console.log('[Visitor] Visitor record created in Supabase.');
            }
        }

        async function acceptConsent() {
            console.log('[Consent Action] User accepted data collection.');
            localStorage.setItem('userConsent', 'accepted');
            document.getElementById('consentBanner').classList.add('hidden');
            initializeSupabaseIfNeeded();
            let visitorId = localStorage.getItem('visitor_id');
            if (!visitorId) {
                console.log('[Visitor] visitor_id not found, creating...');
                visitorId = generateUUID();
                localStorage.setItem('visitor_id', visitorId);
                console.log('[Visitor] visitor_id created successfully!');
                createVisitorRecord(visitorId);
            } else {
                console.log('[Visitor] visitor_id found!');
            }
            // First update the contact section (which inserts the form)
            if (typeof updateContactSection === 'function') updateContactSection();
            // Then enable the form
            enableContactForm();
        }

        function rejectConsent() {
            console.log('[Consent Action] User rejected data collection.');
            localStorage.setItem('userConsent', 'rejected');
            document.getElementById('consentBanner').classList.add('hidden');
            supabase = null;
            // Disable contact form
            disableContactForm("Contact form is disabled because data collection was rejected. Please accept data collection in the privacy policy if you'd like to send a message.");
        }

        // Add these new functions to handle thse contact form state
        function disableContactForm(message) {
            const form = document.getElementById('contactForm');
            const inputs = form.querySelectorAll('input, textarea, button');
            inputs.forEach(input => input.disabled = true);
            
            // Add message above the form
            const messageDiv = document.createElement('div');
            messageDiv.className = 'bg-red-100 text-red-700 p-4 rounded-lg mb-6';
            messageDiv.id = 'contactFormDisabledMessage';
            messageDiv.textContent = message;
            
            // Remove any existing message
            const existingMessage = document.getElementById('contactFormDisabledMessage');
            if (existingMessage) existingMessage.remove();
            
            // Insert message before the form
            form.parentNode.insertBefore(messageDiv, form);
            
            // Add opacity to show it's disabled
            form.style.opacity = '0.5';
        }

        function enableContactForm() {
            const form = document.getElementById('contactForm');
            const inputs = form.querySelectorAll('input, textarea, button');
            inputs.forEach(input => input.disabled = false);
            
            // Remove disabled message if it exists
            const messageDiv = document.getElementById('contactFormDisabledMessage');
            if (messageDiv) messageDiv.remove();
            
            // Restore opacity
            form.style.opacity = '1';
        }

        function initializeDataCollection() {
            console.log('Initializing data collection...');
            
            try {
                // Initialize Supabase client
                supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
                
                // Generate UUID only after consent
                if (!localStorage.getItem('visitor_id')) {
                    const uuid = generateUUID();
                    localStorage.setItem('visitor_id', uuid);
                    console.log('Generated new visitor ID:', uuid);
                    
                    // Get timezone info
                    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    let locationInfo = {
                        timezone: timezone,
                        continent: timezone.split('/')[0],
                        country: timezone.split('/')[1],
                        city: timezone.split('/')[2] || 'Unknown'
                    };

                    // Create visitor in database
                    supabase
                        .from('visitors')
                        .insert({
                            id: uuid,
                            location: locationInfo,
                            user_agent: navigator.userAgent,
                            language: navigator.language
                        })
                        .then(({ error }) => {
                            if (error) {
                                console.error('Error creating visitor:', error);
                            } else {
                                console.log('Visitor created successfully');
                            }
                        });
                }
                
                console.log('Data collection initialized successfully');
            } catch (error) {
                console.error('Error initializing data collection:', error);
                supabase = null; // Reset supabase client if initialization fails
            }
        }

        // Modify your existing functions to check for consent
        async function getOrCreateVisitor() {
            if (!dataCollectionEnabled) {
                console.log('Data collection not enabled - no consent');
                return null;
            }
            
            try {
                let visitorId = localStorage.getItem('visitor_id');
                
                if (!visitorId) {
                    // Create new visitor
                    visitorId = generateUUID();
                    
                    // Get timezone info
                    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    let locationInfo = {
                        timezone: timezone,
                        continent: timezone.split('/')[0],
                        country: timezone.split('/')[1],
                        city: timezone.split('/')[2] || 'Unknown'
                    };

                    try {
                        // Try to get more detailed location info
                        const response = await fetch('https://ipapi.co/json/');
                        if (response.ok) {
                            const data = await response.json();
                            locationInfo = {
                                continent: data.continent_code,
                                country: data.country_name,
                                city: data.city,
                                timezone: data.timezone
                            };
                        }
                    } catch (error) {
                        console.log('Using fallback location from timezone');
                    }

                    // Create visitor in database
                    const { data, error } = await supabase
                        .from('visitors')
                        .insert({
                            id: visitorId,
                            location: locationInfo,
                            user_agent: navigator.userAgent,
                            language: navigator.language
                        })
                        .select()
                        .single();

                    if (error) {
                        console.error('Error creating visitor:', error);
                        return null;
                    }

                    // Save to localStorage only after successful creation
                    localStorage.setItem('visitor_id', visitorId);
                }

                return visitorId;
            } catch (error) {
                console.error('Error in getOrCreateVisitor:', error);
                return null;
            }
        }

        // Modify other data collection functions to check for consent
        async function createFlowerIssue() {
            if (!supabase) {
                console.log('No data collection - Supabase not initialized');
                return { success: false, error: 'No consent for data collection' };
            }
            try {
                // Only use existing visitor ID
                let visitorId = localStorage.getItem('visitor_id');
                console.log('Retrieved visitor ID');
                if (!visitorId) {
                    console.error('No visitor_id found! This should not happen. Please accept data collection consent.');
                    return { success: false, error: 'No visitor ID found. Please accept data collection consent.' };
                }
                // Create flower in database
                console.log('Creating flower for visitor');
                const { data, error } = await supabase
                    .from('flowers')
                    .insert({
                        visitor_id: visitorId
                    })
                    .select('*, visitors(*)')
                    .single();
                if (error) {
                    console.error('Error inserting flower:', error);
                    return { success: false, error: error.message };
                }
                console.log('Flower created successfully!');
                return { success: true, data };
            } catch (error) {
                console.error('Error in createFlowerIssue:', error);
                return { success: false, error: error.message };
            }
        }

        async function createFeedbackIssue(project, isLike) {
            if (!supabase) {
                console.log('No data collection - Supabase not initialized');
                return { success: false, error: 'No consent for data collection' };
            }
            
            try {
                const visitorId = localStorage.getItem('visitor_id');
                if (!visitorId) return { success: false, error: 'No visitor ID found' };

                const { error } = await supabase
                    .from('feedback')
                    .insert({
                        visitor_id: visitorId,
                        project,
                        is_like: isLike
                    });
                
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('Error saving feedback:', error);
                return { success: false };
            }
        }

                        function showTab(tabName, clickedButton) {
                            // Hide all tab contents
                            document.querySelectorAll('.tab-content').forEach(content => {
                                content.classList.add('hidden');
                            });
                            // Show selected tab content and ensure scrollable-content is present
                            const tab = document.getElementById(tabName);
                            tab.classList.remove('hidden');
                            tab.classList.add('scrollable-content');
                            // Reset all buttons to clickable state
                            const buttons = document.querySelectorAll('#aboutAppBtn, #storyBtn, #charactersBtn');
                            buttons.forEach(button => {
                                button.classList.remove('opacity-70', 'bg-secondary/70', 'cursor-default');
                                button.classList.add('bg-secondary', 'hover:bg-secondary/90', 'cursor-pointer');
                            });
                            // Make clicked button lighter and unclickable
                            clickedButton.classList.add('opacity-70', 'bg-secondary/70', 'cursor-default');
                            clickedButton.classList.remove('hover:bg-secondary/90', 'cursor-pointer');
                        }

                        // Initialize the default state (About App tab)
                        window.addEventListener('DOMContentLoaded', () => {
                            const aboutAppBtn = document.getElementById('aboutAppBtn');
                            const aboutAppContent = document.getElementById('aboutApp');
                            // Show About App content
                            document.querySelectorAll('.tab-content').forEach(content => {
                                content.classList.add('hidden');
                            });
                            aboutAppContent.classList.remove('hidden');
                            aboutAppContent.classList.add('scrollable-content');
                            // Style About App button as unclickable
                            aboutAppBtn.classList.add('opacity-70', 'bg-secondary/70', 'cursor-default');
                            aboutAppBtn.classList.remove('hover:bg-secondary/90', 'cursor-pointer');
                        });

                        // Add this after your existing showTab function
                        const timerImages = ['timer1.png', 'timer2.png', 'timer3.png'];
                        let currentImageIndex = 0;
                        const mainTimerImage = document.getElementById('mainTimerImage');
                        const prevSketch = document.getElementById('prevSketch');
                        const nextSketch = document.getElementById('nextSketch');

                        function updateTimerImage() {
                            mainTimerImage.src = timerImages[currentImageIndex];
                            // Update button states
                            prevSketch.style.opacity = currentImageIndex === 0 ? '0.5' : '1';
                            prevSketch.style.cursor = currentImageIndex === 0 ? 'default' : 'pointer';
                            nextSketch.style.opacity = currentImageIndex === timerImages.length - 1 ? '0.5' : '1';
                            nextSketch.style.cursor = currentImageIndex === timerImages.length - 1 ? 'default' : 'pointer';
                        }

                        prevSketch.addEventListener('click', () => {
                            if (currentImageIndex > 0) {
                                currentImageIndex--;
                                updateTimerImage();
                            }
                        });

                        nextSketch.addEventListener('click', () => {
                            if (currentImageIndex < timerImages.length - 1) {
                                currentImageIndex++;
                                updateTimerImage();
                            }
                        });

                        // Initialize button states
                        updateTimerImage();



            function updateContactSection() {
                const contactContent = document.getElementById('contactContent');
                
                if (supabase) {
                    // Show full form when data collection is accepted
                    contactContent.innerHTML = `
                        <form id="contactForm" class="space-y-6">
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label for="name" class="block text-sm mb-2">Name</label>
                                    <input type="text" id="name" name="name" class="w-full px-4 py-3 !rounded-button" required>
                                </div>
                                <div>
                                    <label for="email" class="block text-sm mb-2">Email</label>
                                    <input type="email" id="email" name="email" class="w-full px-4 py-3 !rounded-button" required>
                                </div>
                            </div>
                            
                            <div>
                                <label for="subject" class="block text-sm mb-2">Subject</label>
                                <input type="text" id="subject" name="subject" class="w-full px-4 py-3 !rounded-button" required>
                            </div>
                            
                            <div>
                                <label for="message" class="block text-sm mb-2">Message</label>
                                <textarea id="message" name="message" rows="5" class="w-full px-4 py-3 !rounded-button" required></textarea>
                            </div>
                            
                            <div class="flex items-start">
                                <input type="checkbox" id="newsletter" name="newsletter" class="custom-checkbox mt-1">
                                <label for="newsletter" class="ml-3 text-sm text-primary/70">Subscribe to occasional updates about new projects and writings</label>
                            </div>

                            <!-- Success message (hidden by default) -->
                            <div id="successMessage" class="hidden bg-green-100 text-green-700 px-4 py-3 rounded-lg">
                                Thank you for your message! I'll get back to you soon.
                            </div>

                            <!-- Error message (hidden by default) -->
                            <div id="errorMessage" class="hidden bg-red-100 text-red-700 px-4 py-3 rounded-lg">
                                Oops! Something went wrong. Please try again later.
                            </div>
                            
                            <button type="submit" class="w-full px-6 py-3 bg-secondary text-white !rounded-button hover:bg-secondary/90 transition-colors whitespace-nowrap">
                                Send Message
                            </button>
                        </form>
                    `;

                    // Re-attach the form submission handler
                    document.getElementById('contactForm').addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        const submitButton = this.querySelector('button[type="submit"]');
                        const successMessage = document.getElementById('successMessage');
                        const errorMessage = document.getElementById('errorMessage');
                        
                        submitButton.disabled = true;
                        submitButton.innerHTML = 'Sending...';
                        
                        successMessage.classList.add('hidden');
                        errorMessage.classList.add('hidden');

                        try {
                            // Get or create visitor ID
                            const visitorId = localStorage.getItem('visitor_id');
                            if (!visitorId) {
                                throw new Error('No visitor ID found');
                            }

                            // Now send the message
                            const formData = {
                                visitor_id: visitorId,
                                name: this.name.value,
                                email: this.email.value,
                                subject: this.subject.value,
                                message: this.message.value,
                                newsletter: this.newsletter.checked,
                                created_at: new Date().toISOString()
                            };

                            const { error } = await supabase
                                .from('messages')
                                .insert(formData);

                            if (error) throw error;

                            successMessage.classList.remove('hidden');
                            this.reset();
                        } catch (error) {
                            console.error('Error sending message:', error);
                            errorMessage.textContent = 'Error sending message: ' + error.message;
                            errorMessage.classList.remove('hidden');
                        } finally {
                            submitButton.disabled = false;
                            submitButton.innerHTML = 'Send Message';
                        }
                    });
                } else {
                    // Show simple email link when data collection is rejected
                    contactContent.innerHTML = `
                        <div class="text-center">
                            <a href="mailto:valkyrie4200@gmail.com" 
                               class="inline-block px-8 py-4 bg-secondary text-white !rounded-button hover:bg-secondary/90 transition-all duration-300 transform hover:scale-105">
                                Contact Me
                            </a>
                        </div>
                    `;
                }
            }

    

            // Also check consent status on page load
            document.addEventListener('DOMContentLoaded', function() {
                const hasConsent = localStorage.getItem('userConsent');
                console.log('Checking existing consent:', hasConsent);
                
                if (hasConsent === 'accepted') {
                    console.log('Found existing consent, initializing Supabase');
                    initializeSupabaseIfNeeded();
                }
                updateContactSection(); // Add this line
            });







        // Function to get or create visitor ID
        function getVisitorId() {
            let visitorId = localStorage.getItem('portfolio_visitor_id');
            if (!visitorId) {
                visitorId = generateUUID();
                localStorage.setItem('portfolio_visitor_id', visitorId);
            }
            return visitorId;
        }

        // Function to get basic visitor info
        function getVisitorInfo() {
            return {
                visitor_id: getVisitorId(),
                userAgent: navigator.userAgent,
                language: navigator.language,
                timestamp: new Date().toISOString(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
        }

        // Function to handle flower clicks
        async function createFlowerIssue() {
            if (!supabase) {
                console.log('No data collection - Supabase not initialized');
                return { success: false, error: 'No consent for data collection' };
            }
            try {
                // Only use existing visitor ID
                let visitorId = localStorage.getItem('visitor_id');
                console.log('Retrieved visitor ID');
                if (!visitorId) {
                    console.error('No visitor_id found! This should not happen. Please accept data collection consent.');
                    return { success: false, error: 'No visitor ID found. Please accept data collection consent.' };
                }
                // Create flower in database
                console.log('Creating flower for visitor');
                const { data, error } = await supabase
                    .from('flowers')
                    .insert({
                        visitor_id: visitorId
                    })
                    .select('*, visitors(*)')
                    .single();
                if (error) {
                    console.error('Error inserting flower:', error);
                    return { success: false, error: error.message };
                }
                console.log('Flower created successfully!');
                return { success: true, data };
            } catch (error) {
                console.error('Error in createFlowerIssue:', error);
                return { success: false, error: error.message };
            }
        }

        // Function to handle project feedback
            async function createFeedbackIssue(project, isLike) {
                if (!supabase) {
                    console.log('No data collection - Supabase not initialized');
                    return { success: false, error: 'No consent for data collection' };
                }
                
                try {
                    const visitorId = localStorage.getItem('visitor_id');
                    if (!visitorId) return { success: false, error: 'No visitor ID found' };

                    const { error } = await supabase
                    .from('feedback')
                        .insert({
                            visitor_id: visitorId,
                        project,
                            is_like: isLike
                        });
                
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('Error saving feedback:', error);
                    return { success: false };
                }
            }

        // Test Supabase connection
        async function testSupabaseConnection() {
            try {
                console.log('Testing Supabase connection...');
                const { data, error } = await supabase
                    .from('flowers')
                    .select('count')
                    .limit(1);
                
                if (error) throw error;
                console.log('Supabase connection successful!');
                return true;
            } catch (error) {
                console.error('Supabase connection error:', error);
                return false;
            }
        }

        // Run the test when page loads
        document.addEventListener('DOMContentLoaded', function() {
            testSupabaseConnection();
            // ... rest of your DOMContentLoaded code ...
        });

        document.addEventListener('DOMContentLoaded', function() {
            // Add event listeners for "Explore other projects" buttons
            document.querySelectorAll('.explore-other-projects').forEach(button => {
                button.addEventListener('click', showDefaultView);
            });

            // Smooth scrolling for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    // Only proceed if href is not just "#"
                    if (targetId && targetId !== '#') {
                        const targetElement = document.querySelector(targetId);
                        if (targetElement) {
                            window.scrollTo({
                                top: targetElement.offsetTop - 80,
                                behavior: 'smooth'
                            });
                        }
                    }
                });
            });

            // Project card expansion functionality
            const projectsGrid = document.querySelector('.projects-grid');
            const projectCards = document.querySelectorAll('.project-card');

            // Only proceed if we found all necessary elements
            if (!projectsGrid || !projectCards.length) {
                console.warn('Some required elements were not found');
                return;
            }

            let animationTimer = null;
            let currentMessageListener = null;

            function createFeedbackOverlay(container) {
                const overlay = document.createElement('div');
                overlay.className = 'feedback-overlay';
                
                const content = document.createElement('div');
                content.className = 'feedback-content';
                
                if (supabase) {  // If data collection was accepted
                const question = document.createElement('div');
                question.className = 'feedback-question';
                question.textContent = 'Did you like what you just saw?';
                
                const buttons = document.createElement('div');
                buttons.className = 'feedback-buttons';
                
                const likeBtn = document.createElement('button');
                likeBtn.className = 'feedback-button';
                likeBtn.innerHTML = '<i class="ri-thumb-up-line ri-xl"></i>';
                
                const dislikeBtn = document.createElement('button');
                dislikeBtn.className = 'feedback-button';
                dislikeBtn.innerHTML = '<i class="ri-thumb-down-line ri-xl"></i>';
                
                const thanks = document.createElement('div');
                thanks.className = 'feedback-thanks';
                thanks.textContent = 'Thanks for your feedback:)';

                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'flex flex-col items-center gap-4 mt-6';

                const playAgainBtn = document.createElement('button');
                    playAgainBtn.className = 'feedback-play-again-btn';
                playAgainBtn.textContent = 'Play Again';
                    playAgainBtn.style.display = 'none'; // Initially hidden

                    const backBtn = document.createElement('button');
                    backBtn.className = 'feedback-back-btn';
                    backBtn.textContent = 'Explore Other Projects';
                    backBtn.style.display = 'none'; // Initially hidden
                    backBtn.onclick = showDefaultView; // Add this line to make it work

                    // Add event listeners for the feedback buttons
                    likeBtn.addEventListener('click', () => handleFeedback(true, likeBtn, dislikeBtn, thanks, playAgainBtn, backBtn));
                    dislikeBtn.addEventListener('click', () => handleFeedback(false, likeBtn, dislikeBtn, thanks, playAgainBtn, backBtn));

                    buttons.appendChild(likeBtn);
                    buttons.appendChild(dislikeBtn);
                    buttonContainer.appendChild(playAgainBtn);
                    buttonContainer.appendChild(backBtn);
                    
                    content.appendChild(question);
                    content.appendChild(buttons);
                    content.appendChild(thanks);
                    content.appendChild(buttonContainer);
                } else {  // If data collection was rejected/ignored
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'flex flex-col items-center gap-4';

                    const playAgainBtn = document.createElement('button');
                    playAgainBtn.className = 'feedback-play-again-btn';
                    playAgainBtn.textContent = 'Play Again';
                    playAgainBtn.style.display = 'block';

                    const exploreBtn = document.createElement('button');
                    exploreBtn.className = 'feedback-back-btn';
                    exploreBtn.textContent = 'Explore Other Projects';
                    exploreBtn.style.display = 'block';

                    buttonContainer.appendChild(playAgainBtn);
                    buttonContainer.appendChild(exploreBtn);
                    content.appendChild(buttonContainer);

                    // Add click handlers
                    exploreBtn.onclick = showDefaultView;
                }

                // Common play again functionality
                const playAgainBtn = content.querySelector('.feedback-play-again-btn');
                if (playAgainBtn) {
                playAgainBtn.onclick = () => {
                    if (animationTimer) {
                        clearTimeout(animationTimer);
                        animationTimer = null;
                    }
                    
                    overlay.classList.remove('visible');
                    
                    const iframe = container.querySelector('iframe');
                    if (iframe) {
                        const originalSrc = iframe.src;
                        
                        if (currentMessageListener) {
                            window.removeEventListener('message', currentMessageListener);
                        }
                        
                        iframe.src = 'about:blank';
                        setTimeout(() => {
                            iframe.src = originalSrc;
                            
                            currentMessageListener = (event) => {
                                if (event.data === 'animationStarted' || event.data === 'animationRestarted') {
                                    if (animationTimer) {
                                        clearTimeout(animationTimer);
                                    }

                                    const projectType = iframe.src.includes('dandelion.html') ? 'dandelion' : 
                                                      iframe.src.includes('rain_github.html') ? 'rain' :
                                                      iframe.src.includes('changeme_project.html') ? 'changeme' :
                                                      'default';
                                    
                                    const timerDuration = {
                                            'dandelion': 2000,
                                            'rain': 18000,
                                            'changeme': 15000,
                                            'default': 10000
                                    }[projectType];

                                    animationTimer = setTimeout(() => {
                                        if (iframe && iframe.contentWindow) {
                                            iframe.contentWindow.postMessage('stopAnimation', '*');
                                            overlay.classList.add('visible');
                                        }
                                    }, timerDuration);
                                }
                            };
                            
                            window.addEventListener('message', currentMessageListener);
                            }, 100);
                        }
                    };
                }

                overlay.appendChild(content);
                return overlay;
            }

            // Add back the feedback handling function
            async function handleFeedback(isLike, likeBtn, dislikeBtn, thanks, playAgainBtn, backBtn) {
                // Get the project name from the current expanded card
                const expandedCard = document.querySelector('.project-card.expanded');
                const projectTitle = expandedCard.querySelector('h3').textContent;
                
                // Create feedback through server
                await createFeedbackIssue(projectTitle, isLike);
                
                // Update UI
                if (isLike) {
                    likeBtn.classList.add('liked');
                    dislikeBtn.disabled = true;
                } else {
                    dislikeBtn.classList.add('disliked');
                    likeBtn.disabled = true;
                }
                
                // Show thanks message and buttons
                thanks.classList.add('visible');
                if (playAgainBtn) playAgainBtn.style.display = 'block';
                if (backBtn) backBtn.style.display = 'block';
            }

            // Function to handle content toggle for all projects
            function setupContentToggle(projectId) {
                const toggleBtn = document.getElementById(`${projectId}-toggle-content`);
                const descContent = document.getElementById(`${projectId}-description-content`);
                const inspContent = document.getElementById(`${projectId}-inspiration-content`);
                
                if (toggleBtn && descContent && inspContent) {
                    toggleBtn.addEventListener('click', () => {
                        // Toggle visibility with fade effect
                        if (descContent.classList.contains('hidden')) {
                            // Switch to description
                            inspContent.classList.add('opacity-0');
                            setTimeout(() => {
                                inspContent.classList.add('hidden');
                                descContent.classList.remove('hidden');
                                setTimeout(() => {
                                    descContent.classList.remove('opacity-0');
                                }, 50);
                            }, 300);
                            toggleBtn.textContent = 'Inspiration';
                        } else {
                            // Switch to inspiration
                            descContent.classList.add('opacity-0');
                            setTimeout(() => {
                                descContent.classList.add('hidden');
                                inspContent.classList.remove('hidden');
                                setTimeout(() => {
                                    inspContent.classList.remove('opacity-0');
                                }, 50);
                            }, 300);
                            toggleBtn.textContent = 'Back';
                        }
                    });
                }
            }

            function showExpandedView(card) {
                // Hide other cards
                projectCards.forEach(otherCard => {
                    if (otherCard !== card) {
                        otherCard.style.opacity = '0';
                        otherCard.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            otherCard.classList.add('hidden');
                        }, 200);
                    }
                });

                // Get the first project card's position to use as reference
                const firstCard = projectCards[0];
                const firstCardTop = firstCard.getBoundingClientRect().top + window.pageYOffset;

                requestAnimationFrame(() => {
                    projectsGrid.classList.add('expanded');
                    card.classList.add('expanded');

                    const projectDetail = card.querySelector('.project-detail');
                    if (projectDetail) {
                        setTimeout(() => {
                            projectDetail.classList.add('visible');
                            // Set up content toggle for each project
                            if (card.querySelector('iframe[src*="rain_github.html"]')) {
                                setupContentToggle('rain');
                            } else if (card.querySelector('iframe[src*="changeme_project.html"]')) {
                                setupContentToggle('changeme');
                            } else if (card.querySelector('iframe[src*="dandelion.html"]')) {
                                setupContentToggle('dandelion');
                            }
                        }, 200);
                    }

                    // Scroll to the same position as the first card
                    const offset = 100;
                    window.scrollTo({
                        top: firstCardTop - offset,
                        behavior: 'smooth'
                    });

                    // Get the iframe and set up the timer
                    const iframe = card.querySelector('iframe');
                    if (iframe) {
                        // Create and add the feedback overlay
                        const feedbackOverlay = createFeedbackOverlay(iframe.parentElement);
                        iframe.parentElement.appendChild(feedbackOverlay);
                        
                        // Remove any existing message listener
                        if (currentMessageListener) {
                            window.removeEventListener('message', currentMessageListener);
                            currentMessageListener = null;
                        }

                        // Clear any existing timer
                        if (animationTimer) {
                            clearTimeout(animationTimer);
                            animationTimer = null;
                        }
                        
                        // Create new message listener
                        currentMessageListener = function(event) {
                            console.log('Received message:', event.data); // Debug log
                            
                            if (event.data === 'animationStarted' || event.data === 'animationRestarted') {
                                console.log('Animation started/restarted, setting timer'); // Debug log
                                // Clear any existing timer
                                if (animationTimer) {
                                    clearTimeout(animationTimer);
                                }

                                // Get project type from the iframe source
                                const projectType = iframe.src.includes('dandelion.html') ? 'dandelion' : 
                                                  iframe.src.includes('rain_github.html') ? 'rain' :
                                                  iframe.src.includes('changeme_project.html') ? 'changeme' :
                                                  'default';
                                
                                // Set different timers based on project type
                                const timerDuration = {
                                    'dandelion': 2000,   // 2 seconds for dandelion
                                    'rain': 18000,      // 18 seconds for rain
                                    'changeme': 15000,  // 15 seconds for changeme
                                    'default': 10000    // 10 seconds default
                                }[projectType];

                                console.log('Setting timer for project type:', projectType, 'duration:', timerDuration);

                                // Start the timer
                                animationTimer = setTimeout(() => {
                                    console.log('Timer finished, stopping animation'); // Debug log
                                    if (iframe && iframe.contentWindow) {
                                        iframe.contentWindow.postMessage('stopAnimation', '*');
                                        feedbackOverlay.classList.add('visible');
                                    }
                                }, timerDuration);
                            } else if (event.data === 'animationStopped') {
                                console.log('Animation stopped by iframe');
                                feedbackOverlay.classList.add('visible');
                            }
                        };
                        
                        // Add the new listener
                        window.addEventListener('message', currentMessageListener);

                        // Set up a one-time load event listener to start the animation
                        iframe.onload = function() {
                            // Remove the onload listener to prevent multiple triggers
                            iframe.onload = null;
                            
                            // Short delay to ensure the iframe content is ready
                            setTimeout(() => {
                                if (iframe.contentWindow) {
                                    iframe.contentWindow.postMessage('startAnimation', '*');
                                }
                            }, 500);
                        };
                    }
                });
            }

            function showDefaultView() {
                const expandedCard = document.querySelector('.project-card.expanded');
                if (!expandedCard) return;

                // Remove feedback overlay if it exists
                const overlay = expandedCard.querySelector('.feedback-overlay');
                if (overlay) {
                    overlay.remove();
                }

                // Remove the message event listener
                if (currentMessageListener) {
                    window.removeEventListener('message', currentMessageListener);
                    currentMessageListener = null;
                }

                // Clear any existing timers
                if (animationTimer) {
                    clearTimeout(animationTimer);
                    animationTimer = null;
                }

                const projectDetail = expandedCard.querySelector('.project-detail');
                if (projectDetail) {
                    projectDetail.classList.remove('visible');
                }

                // Stop the animation by setting iframe src to blank
                const iframe = expandedCard.querySelector('iframe');
                if (iframe) {
                    const originalSrc = iframe.src;
                    iframe.src = 'about:blank';
                    setTimeout(() => {
                        iframe.src = originalSrc;
                    }, 100);
                    // Remove any stop message if it exists
                    const message = iframe.parentElement.querySelector('div');
                    if (message) {
                        message.remove();
                    }
                }

                requestAnimationFrame(() => {
                    projectsGrid.classList.remove('expanded');
                    expandedCard.classList.remove('expanded');
                    
                    projectCards.forEach(card => {
                        card.classList.remove('hidden');
                        requestAnimationFrame(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'none';
                        });
                    });
                });
            }

            // Add click handlers only to cards that have the view project link
            projectCards.forEach(card => {
                const viewProjectLink = card.querySelector('.view-project');
                if (viewProjectLink) {
                    viewProjectLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        showExpandedView(card);
                    });
                }
            });

            const giveFlowerBtn = document.getElementById('giveFlowerBtn');
            const flowerAnimation = document.getElementById('flowerAnimation');
            const profileImage = document.getElementById('profileImage');
            const flowerProfileImage = document.getElementById('flowerProfileImage');
            const thanksProfileImage = document.getElementById('thanksProfileImage');

            function createFlower() {
                const flowerContainer = document.createElement('div');
                flowerContainer.className = 'flower-container';
                flowerAnimation.innerHTML = ''; // Clear any existing content
                flowerAnimation.appendChild(flowerContainer);

                // Create center
                const center = document.createElement('div');
                center.className = 'flower-center';
                flowerContainer.appendChild(center);

                // Create petals
                const petalCount = 12;
                for (let i = 0; i < petalCount; i++) {
                    const petal = document.createElement('div');
                    petal.className = 'petal';
                    petal.style.setProperty('--rotate', `${(360 / petalCount) * i}deg`);
                    flowerContainer.appendChild(petal);
                }

                // Create count display
                const countDisplay = document.createElement('div');
                countDisplay.className = 'flower-count-display';
                flowerAnimation.appendChild(countDisplay);

                return { center, petals: flowerContainer.querySelectorAll('.petal'), countDisplay };
            }

            // Function to animate flower and show counts
            async function animateFlower() {
                console.log('Starting flower animation');
                console.log('Supabase status:', supabase ? 'initialized' : 'not initialized');
                
                flowerAnimation.style.opacity = '1';
                const { center, petals, countDisplay } = createFlower();

                const petalBloomTime = 200 + (petals.length * 100);

                setTimeout(() => center.classList.add('bloom'), 100);

                petals.forEach((petal, index) => {
                    setTimeout(() => petal.classList.add('bloom'), 200 + (index * 100));
                });

                // Helper function for ordinal numbers
                function getOrdinalSuffix(n) {
                    const s = ["th", "st", "nd", "rd"];
                    const v = n % 100;
                    return s[(v - 20) % 10] || s[v] || s[0];
                }

                setTimeout(async () => {
                    console.log('Starting count display logic');
                    console.log('Supabase status (in timeout):', supabase ? 'initialized' : 'not initialized');
                    
                    if (supabase) {
                        try {
                            console.log('Fetching flower counts...');
                            // Get total count - fixed query
                            const { data: allFlowers, error: countError } = await supabase
                                .from('flowers')
                                .select('*', { count: 'exact' });

                            if (countError) {
                                console.error('Error fetching total flowers:', countError);
                                throw countError;
                            }
                            
                            const totalCount = allFlowers ? allFlowers.length : 0;
                            console.log('Total flowers:', totalCount);

                            // Get your personal count - fixed query
                            const visitorId = localStorage.getItem('visitor_id');
                        
                            
                            const { data: personalFlowers, error: personalError } = await supabase
                                .from('flowers')
                                .select('*')
                                .eq('visitor_id', visitorId);

                            if (personalError) {
                                console.error('Error fetching personal flowers:', personalError);
                                throw personalError;
                            }
                            
                            const yourCount = personalFlowers ? personalFlowers.length : 0;
                            console.log('Your flower count:', yourCount);
                            
                            // Adjust ordinal numbers to be 1-based
                            const totalOrdinal = totalCount;
                            const personalOrdinal = yourCount;
                            
                            const message = `✨ You just sent the ${totalOrdinal}${getOrdinalSuffix(totalOrdinal)} flower! (Your ${personalOrdinal}${getOrdinalSuffix(personalOrdinal)} flower) ✨`;
                            console.log('Setting count display message:', message);
                            
                            countDisplay.textContent = message;
                            countDisplay.classList.add('visible');
                        } catch (error) {
                            console.error('Error in count display logic:', error);
                            countDisplay.textContent = `✨ Thank you for the flower! ✨`;
                            countDisplay.classList.add('visible');
                        }
                    } else {
                        console.log('Data collection disabled, showing simple thank you message');
                        countDisplay.textContent = `✨ Thank you for the flower! ✨`;
                        countDisplay.classList.add('visible');
                    }
                }, petalBloomTime + 200);

                setTimeout(() => {
                    console.log('Fading out animation and count display');
                    countDisplay.style.opacity = '0';
                    flowerAnimation.style.opacity = '0';
                    thanksProfileImage.style.opacity = '1';
                }, petalBloomTime + 2200);
            }

            giveFlowerBtn.addEventListener('click', async function() {
                try {
                    this.disabled = true;
                    this.style.opacity = '0.5';
                    
                    if (supabase) {
                        console.log('Button clicked, creating flower...');
                        const result = await createFlowerIssue();
                        console.log('Flower creation result:', result);
                        
                        if (!result.success) {
                            console.error('Flower creation failed:', result.error);
                        }
                    }
                    
                    // Always show animation regardless of data collection status
                    animateFlower();
                    
                } catch (error) {
                    console.error('Error in flower click handler:', error);
                }
            });

            // Add Bulls JavaScript
            const bullsGrid = document.querySelector('.bulls-grid');
            const bullCards = document.querySelectorAll('.bull-card');
            
            bullCards.forEach(card => {
                const preview = card.querySelector('.bull-preview');
                const detail = card.querySelector('.bull-detail');
                const backBtn = card.querySelector('.back-to-bulls');
                let lyricsInitialized = false;
                
                // Click on preview to expand
                preview.addEventListener('click', () => {
                    // Hide other cards
                    bullCards.forEach(otherCard => {
                        if (otherCard !== card) {
                            otherCard.style.display = 'none';
                        }
                    });
                    
                    // Show detail view
                    preview.style.display = 'none';
                    detail.classList.remove('hidden');
                    
                    // Initialize lyrics if not already done
                    if (!lyricsInitialized && card.querySelector('#lyrics')) {
                        const audio = card.querySelector('#audioElement');
                        const lyricsContainer = card.querySelector('#lyrics');
                        const lyrics = [];
                        
                        console.log('Initializing lyrics...');
                        
                        // Fetch and parse the LRC file
                
                        fetch('lyrics.lrc', {
                            method: 'GET',
                            headers: {
                                'Accept': 'text/plain'
                            }
                            
                        })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`HTTP error! status: ${response.status}`);
                                }
                                return response.text();
                            })
                            .then(data => {
                                console.log('Successfully loaded lyrics file');
                                // Clear any existing content
                                lyricsContainer.innerHTML = '';
                                
                                const lines = data.split('\n');
                                lines.forEach(line => {
                                    const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
                                    if (match) {
                                        const minutes = parseInt(match[1]);
                                        const seconds = parseFloat(match[2]);
                                        const text = match[3].trim();
                                        const time = minutes * 60 + seconds;
                                        lyrics.push({ time, text });

                                        const p = document.createElement('p');
                                        p.textContent = text;
                                        p.dataset.time = time; // Store timestamp in data attribute
                                        // Add click handler to seek to timestamp
                                        p.addEventListener('click', () => {
                                            audio.currentTime = time;
                                            // Force immediate visual update
                                            Array.from(lyricsContainer.getElementsByTagName('p')).forEach(p => p.classList.remove('active'));
                                            p.classList.add('active');
                                            // Reset user scroll state
                                            userScrolled = false;
                                            // Scroll to the clicked lyric
                                            const offset = p.offsetTop - lyricsContainer.clientHeight / 2 + p.clientHeight / 2;
                                            lyricsContainer.scrollTo({
                                                top: offset,
                                                behavior: "smooth"
                                            });
                                        });
                                        // Add hover style
                                        p.style.cursor = 'pointer';
                                        lyricsContainer.appendChild(p);
                                    }
                                });
                                console.log(`Loaded ${lyrics.length} lyrics lines`);
                                
                                let scrollTimeout;
                                let userScrolled = false;

                                // Handle manual scrolling
                                lyricsContainer.addEventListener('scroll', () => {
                                    userScrolled = true;
                                    
                                    // Clear existing timeout
                                    if (scrollTimeout) {
                                        clearTimeout(scrollTimeout);
                                    }
                                    
                                    // Set new timeout
                                    scrollTimeout = setTimeout(() => {
                                        userScrolled = false;
                                    }, 3000);
                                });

                                const playButton = card.querySelector('#playButton');
                                const pauseButton = card.querySelector('#pauseButton');
                                const lyricsWrapper = card.querySelector('#lyricsWrapper');

                                // Play button click handler
                                const initialPlayButton = card.querySelector('#initialPlayButton');
                                const startOverButton = card.querySelector('#startOverButton');
                                let isPlaying = false;

                                function updatePlaybackState(playing) {
                                    isPlaying = playing;
                                    if (playing) {
                                        initialPlayButton.style.display = 'none';
                                        lyricsWrapper.style.display = 'flex';
                                        pauseButton.textContent = 'Pause';
                                        pauseButton.style.display = 'block';
                                        startOverButton.style.display = 'block';
                                    } else {
                                        pauseButton.textContent = 'Resume';
                                    }
                                }

                                playButton.addEventListener('click', () => {
                                    audio.play();
                                    updatePlaybackState(true);
                                });

                                // Pause/Resume button click handler
                                pauseButton.addEventListener('click', () => {
                                    if (isPlaying) {
                                        audio.pause();
                                        updatePlaybackState(false);
                                    } else {
                                        audio.play();
                                        updatePlaybackState(true);
                                    }
                                });

                                // Start Over button click handler
                                startOverButton.addEventListener('click', () => {
                                    audio.currentTime = 0;
                                    if (!isPlaying) {
                                        audio.play();
                                        updatePlaybackState(true);
                                    }
                                });

                                // Handle audio ending
                                audio.addEventListener('ended', () => {
                                    updatePlaybackState(false);
                                });

                                // Add timeupdate listener
                                audio.addEventListener('timeupdate', () => {
                                    const currentTime = audio.currentTime;
                                    const paragraphs = lyricsContainer.getElementsByTagName('p');

                                    for (let i = 0; i < lyrics.length; i++) {
                                        if (currentTime >= lyrics[i].time && (!lyrics[i + 1] || currentTime < lyrics[i + 1].time)) {
                                            Array.from(paragraphs).forEach(p => p.classList.remove('active'));
                                            paragraphs[i].classList.add('active');

                                            // Only auto-scroll if user hasn't manually scrolled recently
                                            if (!userScrolled) {
                                                const offset = paragraphs[i].offsetTop - lyricsContainer.clientHeight / 2 + paragraphs[i].clientHeight / 2;
                                                lyricsContainer.scrollTo({
                                                    top: offset,
                                                    behavior: "smooth"
                                                });
                                            }
                                            break;
                                        }
                                    }
                                });
                                
                                lyricsInitialized = true;
                            })
                            .catch(error => {
                                console.error('Error loading lyrics:', error);
                                lyricsContainer.innerHTML = '<p class="text-red-500">Error loading lyrics. Please check the console for details.</p>';
                            });
                    }
                    
                    // Adjust grid
                    bullsGrid.classList.remove('md:grid-cols-3');
                    card.classList.add('expanded');
                });
                
                // Click on back button to collapse
                backBtn.addEventListener('click', () => {
                    // Reset all cards
                    bullCards.forEach(otherCard => {
                        otherCard.style.display = 'block';
                        const otherPreview = otherCard.querySelector('.bull-preview');
                        const otherDetail = otherCard.querySelector('.bull-detail');
                        otherPreview.style.display = 'block';
                        otherDetail.classList.add('hidden');
                    });
                    
                    // Restore grid
                    bullsGrid.classList.add('md:grid-cols-3');
                    card.classList.remove('expanded');
                    
                    // Stop audio if playing
                    const audio = card.querySelector('#audioElement');
                    if (audio) {
                        audio.pause();
                        audio.currentTime = 0;
                    }
                });
            });
        });


         


        window.acceptConsent = acceptConsent;
        window.rejectConsent = rejectConsent;
