// Function to set language and apply RTL if needed
function setLanguage(lang) {
    const elements = document.querySelectorAll('[data-lang-key]');
    elements.forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (translations[lang] && translations[lang][key]) {
            // Check if innerHTML is text or contains markup
            if (el.tagName === 'P' && el.innerHTML.includes('**')) { // Special handling for bold text
                el.innerHTML = translations[lang][key].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            } else {
                el.innerHTML = translations[lang][key];
            }
        }
    });

    const currentLangDisplay = document.querySelector('.current-lang-text');
    if (currentLangDisplay) {
        currentLangDisplay.textContent = lang.toUpperCase();
    }

    // Set document direction
    document.body.classList.remove('rtl', 'ltr');
    if (lang === 'ar') {
        document.body.classList.add('rtl');
    } else {
        document.body.classList.add('ltr');
    }

    // Save selected language to localStorage
    localStorage.setItem('selectedLanguage', lang);

    // Update WhatsApp link language if applicable
    updateWhatsAppLink();

    // Re-populate selects with updated language for country names
    if (document.getElementById('booking-page')) {
        populateCountrySelects();
        // Also re-render participant fields and payment options to apply new language strings
        const numParticipantsSelect = document.getElementById('num-participants');
        if (numParticipantsSelect && numParticipantsSelect.value !== '0') {
            const num = parseInt(numParticipantsSelect.value);
            const relationshipSelect = document.getElementById('relationship');
            generateParticipantForms(num, relationshipSelect ? relationshipSelect.value : '');
            updatePaymentMethods(localStorage.getItem('userCountryCode')); // Re-detect/set payment methods based on IP's country
        }
    }
}

// Function to detect user's preferred language or IP location
async function detectAndSetLanguage() {
    const storedLang = localStorage.getItem('selectedLanguage');
    if (storedLang) {
        setLanguage(storedLang);
        return;
    }

    // Attempt to get language from browser settings
    const browserLang = navigator.language.split('-')[0];
    if (['ar', 'en', 'tr'].includes(browserLang)) {
        setLanguage(browserLang);
        return;
    }

    // Fallback to IP-based detection (using a free API)
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code;
        localStorage.setItem('userCountryCode', countryCode); // Store country code for payment methods

        let detectedLang = 'en'; // Default to English if detection fails or not in supported countries

        if (countryCode === 'TR') {
            detectedLang = 'tr';
        } else if (['EG', 'SA', 'JO', 'AE', 'KW', 'QA', 'BH', 'OM'].includes(countryCode)) { // Egypt, KSA, Jordan, UAE, Kuwait, Qatar, Bahrain, Oman
            detectedLang = 'ar';
        }
        // For other countries, it remains 'en' by default

        setLanguage(detectedLang);

    } catch (error) {
        console.error('Error detecting IP location:', error);
        setLanguage('en'); // Fallback to English on error
    }
}

// --- Home Page Specific Script ---
if (document.getElementById('home-page')) {
    const slogans = [
        "home_slogan_1",
        "home_slogan_2",
        "home_slogan_3"
    ];
    let currentSloganIndex = 0;
    const sloganElement = document.querySelector('.hero p.slogan');

    function changeSlogan() {
        const currentLang = localStorage.getItem('selectedLanguage') || 'en';
        sloganElement.style.animation = 'none'; // Reset animation
        sloganElement.offsetHeight; // Trigger reflow
        sloganElement.style.animation = null; // Reapply animation

        sloganElement.innerHTML = translations[currentLang][slogans[currentSloganIndex]];
        currentSloganIndex = (currentSloganIndex + 1) % slogans.length;
    }

    setInterval(changeSlogan, 8000); // Change slogan every 8 seconds
    changeSlogan(); // Initial slogan display
}

// --- Booking Page Specific Script ---
if (document.getElementById('booking-page')) {
    const basePrice = 500; // USD
    let currentExchangeRate = 1; // Default to 1 (USD)
    let currentCurrencySymbol = '$';
    let currentCurrencyCode = 'USD';
    const participantFieldsContainer = document.getElementById('participant-fields-container');
    const numParticipantsSelect = document.getElementById('num-participants');
    const relationshipField = document.getElementById('relationship-field');
    const relationshipSelect = document.getElementById('relationship');
    const pricePerPersonSpan = document.getElementById('price-per-person');
    const discountSpan = document.getElementById('discount');
    const totalPriceSpan = document.getElementById('total-price');
    const finalPriceSpan = document.getElementById('final-price');
    const paymentMethodsContainer = document.getElementById('payment-methods-container');
    const paymentDetailsDiv = document.getElementById('payment-details');
    const phoneCodeSelect = document.getElementById('phone-code');
    const bookingForm = document.getElementById('booking-form');
    const termsCheckbox = document.getElementById('terms-agree');
    const termsLink = document.getElementById('terms-link');
    const termsPopupOverlay = document.getElementById('terms-popup-overlay');
    const termsPopupContent = document.getElementById('terms-popup-content');
    const termsAgreeButton = document.getElementById('terms-agree-button');
    const termsDisagreeButton = document.getElementById('terms-disagree-button');
    const termsReadCheckbox = document.getElementById('terms-read-checkbox');
    const termsConfirmMessageElement = termsPopupContent.querySelector('p[data-lang-key="booking_terms_confirm_message"]');


    async function getExchangeRate(targetCurrency) {
        if (targetCurrency === 'USD') {
            currentExchangeRate = 1;
            currentCurrencySymbol = '$';
            currentCurrencyCode = 'USD';
            return;
        }
        try {
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`); // Using a reliable free API
            const data = await response.json();
            if (data.rates && data.rates[targetCurrency]) {
                currentExchangeRate = data.rates[targetCurrency];
                currentCurrencyCode = targetCurrency;
                // Determine symbol based on common currencies
                switch (targetCurrency) {
                    case 'TRY':
                        currentCurrencySymbol = '₺';
                        break;
                    case 'EGP':
                        currentCurrencySymbol = 'E£';
                        break;
                    case 'AED':
                        currentCurrencySymbol = 'د.إ';
                        break;
                    case 'JOD':
                        currentCurrencySymbol = 'JD';
                        break;
                    case 'EUR':
                        currentCurrencySymbol = '€';
                        break;
                    case 'GBP':
                        currentCurrencySymbol = '£';
                        break;
                    // Add more as needed
                    default:
                        currentCurrencySymbol = targetCurrency; // Use code if symbol not known
                }
            } else {
                console.warn('Could not get exchange rate for', targetCurrency, 'Falling back to USD.');
                currentExchangeRate = 1;
                currentCurrencySymbol = '$';
                currentCurrencyCode = 'USD';
            }
        } catch (error) {
            console.error('Error fetching exchange rate:', error);
            currentExchangeRate = 1;
            currentCurrencySymbol = '$';
            currentCurrencyCode = 'USD';
        }
    }

    async function updateCurrencyBasedOnIP() {
        let countryCode = localStorage.getItem('userCountryCode');
        if (!countryCode) {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                countryCode = data.country_code;
                localStorage.setItem('userCountryCode', countryCode);
            } catch (error) {
                console.error('Error getting IP for currency:', error);
                countryCode = 'US'; // Fallback
            }
        }

        let targetCurrency = 'USD'; // Default

        if (countryCode === 'TR') {
            targetCurrency = 'TRY';
        } else if (countryCode === 'EG') {
            targetCurrency = 'EGP';
        } else if (['SA', 'AE', 'KW', 'QA', 'BH', 'OM'].includes(countryCode)) { // KSA, UAE, Kuwait, Qatar, Bahrain, Oman
            targetCurrency = 'AED'; // Using AED as a common GCC currency, or USD
            // For GCC, if base price is USD, often payment is done in USD too. Let's keep USD unless specified.
            targetCurrency = 'USD';
        } else if (['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH'].includes(countryCode)) { // European countries including Switzerland
            targetCurrency = 'EUR';
        } else if (['US', 'CA', 'AU'].includes(countryCode)) {
            targetCurrency = 'USD';
        } else if (countryCode === 'GB') {
             targetCurrency = 'GBP';
        } else if (countryCode === 'JO') {
            targetCurrency = 'JOD'; // Jordan Dinar
        }


        await getExchangeRate(targetCurrency);
        updatePriceSummary();
        updatePaymentMethods(countryCode);
    }

    function createParticipantFields(index, relationshipType = '', currentLang) {
        const lang = currentLang;
        const participantLabel = translations[lang].participant_label;
        const maleLabel = translations[lang].male_label;
        const femaleLabel = translations[lang].female_label;
        const coupleMaleLabel = translations[lang].couple_male_label;
        const coupleFemaleLabel = translations[lang].couple_female_label;

        let nameLabel = `${participantLabel} ${index + 1}:`;
        let genderMaleLabel = maleLabel;
        let genderFemaleLabel = femaleLabel;
        let maleChecked = '';
        let femaleChecked = '';
        let genderDisabled = '';

        if (relationshipType === 'couple' && index === 0) {
            nameLabel = `${coupleMaleLabel}:`;
            genderMaleLabel = coupleMaleLabel;
            maleChecked = 'checked';
            genderDisabled = 'disabled';
        } else if (relationshipType === 'couple' && index === 1) {
            nameLabel = `${coupleFemaleLabel}:`;
            genderFemaleLabel = coupleFemaleLabel;
            femaleChecked = 'checked';
            genderDisabled = 'disabled';
        } else if (numParticipantsSelect.value >= 3) {
            // For 3+ participants, use "المشارك" / "المشاركة" based on gender
            // Initial state: no gender checked, user selects
            // Labels are generic participant_label
        } else if (numParticipantsSelect.value === '1') {
             // For single participant, labels are generic participant_label
        }


        return `
            <div class="participant-fields" data-participant-index="${index}">
                <h3>${nameLabel}</h3>
                <div class="form-group">
                    <label for="participant-name-${index}">${translations[lang].booking_participant_name}</label>
                    <input type="text" id="participant-name-${index}" name="participant_name_${index}" required>
                </div>
                <div class="form-group">
                    <label for="participant-dob-${index}">${translations[lang].booking_participant_age}</label>
                    <input type="date" id="participant-dob-${index}" name="participant_dob_${index}" required>
                    <span id="age-error-${index}" class="error-message" style="display:none;">${translations[lang].booking_age_error}</span>
                </div>
                <div class="form-group">
                    <label>${translations[lang].booking_participant_gender}</label>
                    <div class="gender-options">
                        <label>
                            <input type="radio" name="participant_gender_${index}" value="male" ${maleChecked} ${genderDisabled} required>
                            ${genderMaleLabel}
                        </label>
                        <label>
                            <input type="radio" name="participant_gender_${index}" value="female" ${femaleChecked} ${genderDisabled} required>
                            ${genderFemaleLabel}
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label for="participant-nationality-${index}">${translations[lang].booking_participant_nationality}</label>
                    <select id="participant-nationality-${index}" name="participant_nationality_${index}" class="nationality-select" required></select>
                </div>
            </div>
        `;
    }

    function populateCountrySelects() {
        const nationalitySelects = document.querySelectorAll('.nationality-select');
        const phoneCodeSelect = document.getElementById('phone-code');
        const currentLang = localStorage.getItem('selectedLanguage') || 'en';

        // Clear existing options
        nationalitySelects.forEach(select => select.innerHTML = `<option value="">${translations[currentLang].booking_num_participants_placeholder}</option>`);
        phoneCodeSelect.innerHTML = `<option value="">${translations[currentLang].booking_phone_code}</option>`;


        countries.forEach(country => {
            // For nationality
            nationalitySelects.forEach(select => {
                const option = document.createElement('option');
                option.value = country.name;
                option.textContent = `${country.flag} ${country.name}`; // Add flag emoji
                select.appendChild(option);
            });

            // For phone code
            const phoneOption = document.createElement('option');
            phoneOption.value = country.phone;
            phoneOption.textContent = `${country.flag} ${country.name} (+${country.phone})`; // Add flag emoji
            phoneOption.setAttribute('data-country-code', country.code);
            phoneCodeSelect.appendChild(phoneOption);
        });
    }

    function generateParticipantForms(num, relationship = '') {
        const currentLang = localStorage.getItem('selectedLanguage') || 'en';
        participantFieldsContainer.innerHTML = ''; // Clear previous fields

        if (num === 0) {
            relationshipField.style.display = 'none';
            return;
        }

        if (num === 2) {
            relationshipField.style.display = 'block';
            if (relationship === 'couple' || relationship === 'friends') {
                for (let i = 0; i < num; i++) {
                    participantFieldsContainer.innerHTML += createParticipantFields(i, relationship, currentLang);
                }
            } else {
                // If relationship not selected for 2 participants, show empty fields or a prompt
                // For now, let's keep it empty until relationship is chosen
                participantFieldsContainer.innerHTML = '';
            }
        } else {
            relationshipField.style.display = 'none';
            for (let i = 0; i < num; i++) {
                participantFieldsContainer.innerHTML += createParticipantFields(i, '', currentLang);
            }
        }

        addAgeValidationListeners();
        populateCountrySelects();
        updatePriceSummary();
    }

    function handleRelationshipChange() {
        const num = parseInt(numParticipantsSelect.value);
        const relationship = relationshipSelect.value;
        if (num === 2) {
            generateParticipantForms(num, relationship);
        }
    }

    function updatePriceSummary() {
        const num = parseInt(numParticipantsSelect.value);
        let discount = 0;
        let finalPrice = 0;

        if (isNaN(num) || num === 0) {
            pricePerPersonSpan.textContent = `0.00 ${currentCurrencySymbol}`;
            discountSpan.textContent = `0.00 ${currentCurrencySymbol} (0%)`;
            totalPriceSpan.textContent = `0.00 ${currentCurrencySymbol}`;
            finalPriceSpan.textContent = `0.00 ${currentCurrencySymbol}`;
            return;
        }

        let currentTotalPrice = num * basePrice;

        if (num === 2 && relationshipSelect.value === 'couple') {
            discount = currentTotalPrice * 0.10; // 10% for couples
        } else if (num === 2 && relationshipSelect.value === 'friends') {
            discount = currentTotalPrice * 0.05; // 5% for friends
        } else if (num >= 3) {
            discount = currentTotalPrice * 0.10; // 10% for 3+ participants
        }

        finalPrice = currentTotalPrice - discount;

        pricePerPersonSpan.textContent = `${(basePrice * currentExchangeRate).toFixed(2)} ${currentCurrencySymbol}`;
        discountSpan.textContent = `${(discount * currentExchangeRate).toFixed(2)} ${currentCurrencySymbol} (${(discount / currentTotalPrice * 100).toFixed(0)}%)`;
        totalPriceSpan.textContent = `${(currentTotalPrice * currentExchangeRate).toFixed(2)} ${currentCurrencySymbol}`;
        finalPriceSpan.textContent = `${(finalPrice * currentExchangeRate).toFixed(2)} ${currentCurrencySymbol}`;
    }

    function updatePaymentMethods(countryCode) {
        const currentLang = localStorage.getItem('selectedLanguage') || 'en';
        paymentMethodsContainer.innerHTML = `<h3>${translations[currentLang].payment_methods_heading}</h3><div class="payment-options-grid"></div>`;
        const paymentOptionsGrid = paymentMethodsContainer.querySelector('.payment-options-grid');
        paymentDetailsDiv.style.display = 'none';

        let availableMethods = [];

        if (countryCode === 'EG') { // Egypt
            availableMethods = ['instapay', 'vodafone_cash', 'paypal'];
        } else if (countryCode === 'TR') { // Turkey
            availableMethods = ['papara', 'bank_transfer', 'cash'];
        } else if (['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH'].includes(countryCode)) { // Europe (including Switzerland)
            availableMethods = ['revolut', 'paypal'];
        } else { // Rest of the world (including UAE, Jordan, GCC, America, Australia, UK)
            availableMethods = ['bank_transfer', 'paypal'];
        }

        availableMethods.forEach(method => {
            const optionDiv = document.createElement('div');
            optionDiv.classList.add('payment-option');
            optionDiv.setAttribute('data-method', method);

            let iconClass = '';
            let textKey = '';

            switch (method) {
                case 'bank_transfer':
                    iconClass = 'fa-solid fa-building-columns';
                    textKey = 'payment_method_bank_transfer';
                    break;
                case 'cash':
                    iconClass = 'fa-solid fa-money-bill-wave';
                    textKey = 'payment_method_cash';
                    break;
                case 'paypal':
                    iconClass = 'fa-brands fa-paypal';
                    textKey = 'payment_method_paypal';
                    break;
                case 'instapay':
                    iconClass = 'fa-solid fa-mobile-screen-button';
                    textKey = 'payment_method_instapay';
                    break;
                case 'vodafone_cash':
                    iconClass = 'fa-solid fa-money-bill-transfer';
                    textKey = 'payment_method_vodafone_cash';
                    break;
                case 'papara':
                    iconClass = 'fa-solid fa-wallet';
                    textKey = 'payment_method_papara';
                    break;
                case 'revolut':
                    iconClass = 'fa-brands fa-revolut';
                    textKey = 'payment_method_revolut';
                    break;
            }
            optionDiv.innerHTML = `<i class="${iconClass}"></i><p>${translations[currentLang][textKey]}</p>`;
            paymentOptionsGrid.appendChild(optionDiv);

            optionDiv.addEventListener('click', () => {
                document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
                optionDiv.classList.add('selected');
                displayPaymentDetails(method, currentLang);
            });
        });
    }

    function displayPaymentDetails(method, lang) {
        paymentDetailsDiv.style.display = 'block';
        paymentDetailsDiv.innerHTML = ''; // Clear previous content

        let detailsHtml = '';

        switch (method) {
            case 'bank_transfer':
                detailsHtml = `
                    <h4>${translations[lang].bank_details_heading}</h4>
                    <p><strong>${translations[lang].bank_account_name}</strong> JEHAD O. A. ABUSABRA</p>
                    <p><strong>${translations[lang].bank_account_number}</strong> TR520020300008722885000001</p>
                    <p><strong>${translations[lang].bank_swift_code}</strong> DENITRTLXXX</p>
                    <p>Please make the transfer to the above account and send us a screenshot of the transfer receipt to our email for confirmation.</p>
                `;
                break;
            case 'cash':
                detailsHtml = `
                    <h4>${translations[lang].payment_method_cash}</h4>
                    <p>You can pay in cash at our office:</p>
                    <p>Istanbul, Fatih, Opposite Yusufpaşa Tramway, No. 42, Office No. 8</p>
                    <p>Please contact us to arrange an appointment for cash payment.</p>
                `;
                break;
            case 'paypal':
                detailsHtml = `
                    <h4>${translations[lang].payment_method_paypal}</h4>
                    <p>Please pay the final amount using PayPal. The amount displayed is: <strong>${finalPriceSpan.textContent}</strong>.</p>
                    <p>In a real application, a dynamic PayPal button would appear here, allowing you to pay the exact calculated amount.</p>
                    <div id="paypal-dynamic-button-container"></div>
                `;
                // Conceptual rendering of dynamic PayPal button.
                // In a real application, you would load the PayPal SDK and use paypal.Buttons().render()
                // Example (requires server-side to create order):
                /*
                paypal.Buttons({
                    createOrder: function(data, actions) {
                        return fetch('/api/paypal/create-order', {
                            method: 'post',
                            headers: {
                                'content-type': 'application/json'
                            },
                            body: JSON.stringify({
                                amount: finalPriceSpan.textContent.replace(/[^\d.]/g, ''), // Extract just the number
                                currency: currentCurrencyCode
                            })
                        }).then(function(res) {
                            return res.json();
                        }).then(function(orderData) {
                            return orderData.id;
                        });
                    },
                    onApprove: function(data, actions) {
                        // Capture the funds
                        return fetch('/api/paypal/capture-order', {
                            method: 'post',
                            headers: {
                                'content-type': 'application/json'
                            },
                            body: JSON.stringify({
                                orderID: data.orderID
                            })
                        }).then(function(res) {
                            return res.json();
                        }).then(function(details) {
                            alert('Transaction completed by ' + details.payer.name.given_name);
                            // Submit booking form after successful payment
                            sendBookingData(new Event('submit')); // Trigger form submission
                        });
                    }
                }).render('#paypal-dynamic-button-container');
                */
                break;
            case 'instapay':
                detailsHtml = `
                    <h4>${translations[lang].payment_method_instapay}</h4>
                    <p>Please transfer the amount via InstaPay to the following number:</p>
                    <p><strong>+20104723155</strong></p>
                    <p>After transferring, please send a screenshot of the receipt to our email for confirmation.</p>
                `;
                break;
            case 'vodafone_cash':
                detailsHtml = `
                    <h4>${translations[lang].vodafone_cash_details_heading}</h4>
                    <p>Please transfer the amount via Vodafone Cash to the following number:</p>
                    <p><strong>0104723155</strong></p>
                    <p>After transferring, please send a screenshot of the receipt to our email for confirmation.</p>
                `;
                break;
            case 'papara':
                detailsHtml = `
                    <h4>${translations[lang].payment_method_papara}</h4>
                    <p>Please transfer the amount via Papara to our Papara account.</p>
                    <p>Contact us for Papara account details.</p>
                    <p>After transferring, please send a screenshot of the receipt to our email for confirmation.</p>
                `;
                break;
            case 'revolut':
                detailsHtml = `
                    <h4>${translations[lang].payment_method_revolut}</h4>
                    <p>Please transfer the amount via Revolut to our Revolut account.</p>
                    <p>Contact us for Revolut account details.</p>
                    <p>After transferring, please send a screenshot of the receipt to our email for confirmation.</p>
                `;
                break;
        }
        paymentDetailsDiv.innerHTML = detailsHtml;
    }

    function addAgeValidationListeners() {
        const dobInputs = document.querySelectorAll('input[type="date"][id^="participant-dob-"]');
        dobInputs.forEach(input => {
            input.addEventListener('change', (event) => {
                validateAge(event.target);
            });
        });
    }

    function validateAge(inputElement) {
        const dobString = inputElement.value;
        const errorSpan = document.getElementById(`age-error-${inputElement.id.split('-')[2]}`);
        const currentLang = localStorage.getItem('selectedLanguage') || 'en';

        if (!dobString) {
            errorSpan.style.display = 'none';
            inputElement.setCustomValidity('Please enter date of birth.'); // Mark invalid if empty
            return;
        }

        const dob = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        if (age < 18 || age > 45) {
            errorSpan.textContent = translations[currentLang].booking_age_error;
            errorSpan.style.display = 'block';
            inputElement.setCustomValidity(translations[currentLang].booking_age_error); // Prevent form submission
        } else {
            errorSpan.style.display = 'none';
            inputElement.setCustomValidity(''); // Allow form submission
        }
    }

    function getParticipantData() {
        const num = parseInt(numParticipantsSelect.value);
        const participants = [];
        for (let i = 0; i < num; i++) {
            const name = document.getElementById(`participant-name-${i}`).value;
            const dob = document.getElementById(`participant-dob-${i}`).value;
            const genderElement = document.querySelector(`input[name="participant_gender_${i}"]:checked`);
            const gender = genderElement ? genderElement.value : '';
            const nationality = document.getElementById(`participant-nationality-${i}`).value;

            participants.push({
                index: i + 1,
                name: name,
                date_of_birth: dob,
                gender: gender,
                nationality: nationality
            });
        }
        return participants;
    }

    async function sendBookingData(event) {
        event.preventDefault();

        // Validate terms and conditions checkbox
        if (!termsCheckbox.checked) {
            alert(translations[localStorage.getItem('selectedLanguage') || 'en'].booking_terms_confirm_message);
            return;
        }

        // Validate all age fields
        const dobInputs = document.querySelectorAll('input[type="date"][id^="participant-dob-"]');
        let ageValidationFailed = false;
        dobInputs.forEach(input => {
            validateAge(input);
            if (input.customValidity) {
                ageValidationFailed = true;
            }
        });

        if (ageValidationFailed) {
            alert("Please correct the age errors before proceeding.");
            return;
        }

        // Basic form validation
        if (!bookingForm.checkValidity()) {
            alert("Please fill in all required fields correctly.");
            bookingForm.reportValidity(); // Show native browser validation messages
            return;
        }


        const participantsData = getParticipantData();
        const customerEmail = document.getElementById('email').value;
        const phoneCode = phoneCodeSelect.value;
        const phoneNumber = document.getElementById('phone-number').value;
        const selectedRelationship = numParticipantsSelect.value === '2' ? relationshipSelect.value : 'N/A';

        const dataToSend = {
            num_participants: parseInt(numParticipantsSelect.value),
            relationship: selectedRelationship,
            participants: participantsData,
            customer_email: customerEmail,
            phone_number_full: `+${phoneCode}${phoneNumber}`,
            total_price_usd: parseInt(numParticipantsSelect.value) * basePrice,
            final_price_usd: (parseInt(numParticipantsSelect.value) * basePrice - (parseInt(numParticipantsSelect.value) * basePrice * (numParticipantsSelect.value === '2' && relationshipSelect.value === 'couple' ? 0.10 : numParticipantsSelect.value === '2' && relationshipSelect.value === 'friends' ? 0.05 : numParticipantsSelect.value >= '3' ? 0.10 : 0))),
            final_price_local_currency: finalPriceSpan.textContent,
            currency_code: currentCurrencyCode,
            exchange_rate: currentExchangeRate,
            booking_date: new Date().toISOString().slice(0, 10),
            ip_address: localStorage.getItem('userIP') || 'N/A'
        };

        // Format participant data for email (simulated Excel-like table)
        let participantsTableHtml = `
            <table border="1" style="width:100%; border-collapse: collapse; text-align: center;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="padding: 8px;">#</th>
                        <th style="padding: 8px;">Name</th>
                        <th style="padding: 8px;">Date of Birth</th>
                        <th style="padding: 8px;">Gender</th>
                        <th style="padding: 8px;">Nationality</th>
                    </tr>
                </thead>
                <tbody>
                    ${dataToSend.participants.map(p => `
                        <tr>
                            <td style="padding: 8px;">${p.index}</td>
                            <td style="padding: 8px;">${p.name}</td>
                            <td style="padding: 8px;">${p.date_of_birth}</td>
                            <td style="padding: 8px;">${p.gender}</td>
                            <td style="padding: 8px;">${p.nationality}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const emailBody = `
            <h3>New Camp Booking</h3>
            <p><strong>Number of Participants:</strong> ${dataToSend.num_participants}</p>
            <p><strong>Relationship (if 2 participants):</strong> ${dataToSend.relationship}</p>
            <p><strong>Customer Email:</strong> ${dataToSend.customer_email}</p>
            <p><strong>Phone Number:</strong> ${dataToSend.phone_number_full}</p>
            <p><strong>Total Price (USD):</strong> ${dataToSend.total_price_usd.toFixed(2)} USD</p>
            <p><strong>Final Price (Local Currency):</strong> ${dataToSend.final_price_local_currency}</p>
            <p><strong>Booking Date:</strong> ${dataToSend.booking_date}</p>
            <p><strong>IP Address:</strong> ${dataToSend.ip_address}</p>
            <h4>Participants Details:</h4>
            ${participantsTableHtml}
            <br>
            <p>Please note: This is a simulated email submission. In a real application, this data would be sent to a backend server for secure processing and email sending.</p>
        `;

        // In a real application, you'd use a server-side script or a service like EmailJS here.
        // For this client-side only example, we'll just log to console and simulate success.
        console.log("Booking Data to Send:", dataToSend);
        console.log("Simulated Email Content for unitedhr8@gmail.com:\n", emailBody);

        alert('Booking submitted successfully! We will contact you shortly.');
        bookingForm.reset(); // Clear the form
        generateParticipantForms(0); // Reset participant fields
        updatePriceSummary();
        document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
        paymentDetailsDiv.style.display = 'none';

        // Optional: you can redirect to a thank you page
        // window.location.href = 'thankyou.html';
    }

    // Event Listeners for Booking Page
    numParticipantsSelect.addEventListener('change', (event) => {
        const num = parseInt(event.target.value);
        if (num === 2) {
            // Reset relationship dropdown for 2 participants to force selection
            relationshipSelect.value = '';
            relationshipField.style.display = 'block';
            participantFieldsContainer.innerHTML = ''; // Clear fields until relationship is chosen
            updatePriceSummary(); // Update price to 0 or reflect initial state
        } else {
            generateParticipantForms(num);
        }
    });

    relationshipSelect.addEventListener('change', handleRelationshipChange);
    phoneCodeSelect.addEventListener('change', (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex];
        const countryCode = selectedOption.getAttribute('data-country-code');
        updatePaymentMethods(countryCode);
    });

    document.addEventListener('DOMContentLoaded', async () => {
        await detectAndSetLanguage(); // This will also call populateCountrySelects and updatePaymentMethods
        // Initial setup for participants after language and country detection
        if (numParticipantsSelect.value !== '0') {
             generateParticipantForms(parseInt(numParticipantsSelect.value));
        }
    });

    bookingForm.addEventListener('submit', sendBookingData);

    // Terms and Conditions Popup Logic
    termsLink.addEventListener('click', (event) => {
        event.preventDefault();
        termsPopupOverlay.classList.add('show');
        termsReadCheckbox.checked = false; // Ensure it's unchecked when popup opens
        termsConfirmMessageElement.style.display = 'block'; // Ensure message is visible
    });

    termsAgreeButton.addEventListener('click', () => {
        if (termsReadCheckbox.checked) {
            termsCheckbox.checked = true; // Mark main checkbox as checked
            termsPopupOverlay.classList.remove('show');
        } else {
            alert(translations[localStorage.getItem('selectedLanguage') || 'en'].booking_terms_confirm_message);
        }
    });

    termsDisagreeButton.addEventListener('click', () => {
        termsCheckbox.checked = false;
        termsPopupOverlay.classList.remove('show');
        termsReadCheckbox.checked = false; // Also uncheck the popup checkbox
    });

    // When the popup is closed, clear the confirmation message if it was shown
    termsPopupOverlay.addEventListener('transitionend', () => {
        if (!termsPopupOverlay.classList.contains('show')) {
            termsConfirmMessageElement.style.display = 'none';
        }
    });
}


// --- Global Language Switching Logic ---
document.addEventListener('DOMContentLoaded', async () => {
    // Detect and set language on initial load
    await detectAndSetLanguage(); // Wait for language and IP to be detected

    // Language switcher click handler
    const langSwitcher = document.querySelector('.language-switcher');
    const langOptions = document.querySelector('.lang-options');

    if (langSwitcher) {
        langSwitcher.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent document click from closing immediately
            langOptions.classList.toggle('show');
        });
    }

    if (langOptions) {
        langOptions.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const newLang = event.target.getAttribute('data-lang');
                setLanguage(newLang);
                langOptions.classList.remove('show'); // Hide options after selection
            });
        });
    }

    // Close language options if clicked outside
    document.addEventListener('click', (event) => {
        if (langOptions && langOptions.classList.contains('show') && !langSwitcher.contains(event.target)) {
            langOptions.classList.remove('show');
        }
    });

    // Update WhatsApp link language based on current language
    updateWhatsAppLink();
});

function updateWhatsAppLink() {
    const whatsappLink = document.querySelector('.whatsapp-float a');
    if (whatsappLink) {
        const currentLang = localStorage.getItem('selectedLanguage') || 'en';
        let message = '';
        if (currentLang === 'ar') {
            message = 'مرحباً، أود الاستفسار عن مخيم istanova الصيفي.';
        } else if (currentLang === 'tr') {
            message = 'Merhaba, istanova Yaz Kampı hakkında bilgi almak istiyorum.';
        } else {
            message = 'Hello, I would like to inquire about the istanova Summer Camp.';
        }
        whatsappLink.href = `https://wa.me/905457307235?text=${encodeURIComponent(message)}`;
    }
}