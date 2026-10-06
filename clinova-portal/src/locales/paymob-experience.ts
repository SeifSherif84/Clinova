export const paymobExperienceEn = {
  "guideTitle": "Get your integration credentials",
  "backConnect": "Back to Connect Paymob",
  "openGuide": "View credentials guide",
  "requiredCredentials": "Five credentials, one connection",
  "guideIntro": "Find these five credentials in your Paymob Dashboard before entering them into Clinova.",
  "apiSection": "API Keys",
  "integrationSection": "Card Integration ID",
  "integrationSteps": [
    "Open Paymob Dashboard → Settings → Payment Integrations.",
    "Select the appropriate mode: Test or Live.",
    "Find the Card integration.",
    "Copy the Integration ID."
  ],
  "guideFinish": "When you have all five credentials, return to Connect Paymob to enter them directly into the secure form.",
  "zoomImage": "Zoom screenshot",
  "zoomImageLabel": "Zoom {{section}} screenshot",
  "imageFit": "Fit image",
  "imageActual": "View full size",
  "imageUnavailable": "The supplied screenshot could not be loaded. You can still follow the written instructions.",
  "fieldRequired": "Enter {{field}}.",
  "validationTitle": "Review the highlighted fields",
  "consentRequired": "Confirm both statements before connecting.",
  "replace": "Replace {{field}}",
  "keepExisting": "Keep existing {{field}}",
  "savedCredential": "Saved credential — value hidden",
  "newValue": "Enter a new {{field}}",
  "updateUnavailable": "Credential updates are not available from this page yet. Your existing configuration has not been changed.",
  "updateTitle": "Update Paymob credentials",
  "updateDescription": "Replace only the credentials you want to change. Existing sensitive credentials remain protected and are never displayed.",
  "update": "Update credentials",
  "updated": "Paymob configuration updated successfully",
  "updatedDescription": "Your updated Paymob integration credentials have been securely saved. Unchanged credentials remain protected.",
  "noChanges": "Choose at least one credential to replace.",
  "unchanged": "Unchanged credentials will be kept.",
  "cancelUpdate": "Cancel changes",
  "backSettings": "Back to Online Payments",
  "updateConsent": "I confirm that I am authorized to update the Paymob configuration for this clinic.",
  "savedValue": "Current value",
  "replaceHint": "Select Replace to enter a new value. The saved value cannot be revealed.",
  "securityShort": "Credentials are entered directly into Clinova. Patients never see them.",
  "settingsTitle": "Online Payments",
  "settingsDescription": "Manage the Paymob merchant account connected to your clinic.",
  "provider": "Provider",
  "paymentMethod": "Payment method",
  "integration": "Integration",
  "card": "Card",
  "lastUpdated": "Last updated",
  "manage": "Manage",
  "setupGuide": "Setup Guide",
  "disable": "Disable",
  "connected": "Connected",
  "connectedDescription": "Online payments are enabled for this clinic.",
  "savedMeaning": "Connected means your configuration is saved. It does not mean the credentials have been verified with Paymob.",
  "disableUnavailable": "Disabling online payments is not available from this page yet. Your configuration has not been changed.",
  "enableUnavailable": "Enabling online payments is not available from this page yet. Your configuration has not been changed.",
  "actionUnavailable": "This action is not available yet",
  "statusUnavailable": "Payment settings could not be loaded. Try again to see the current configuration.",
  "settingsLoading": "Loading online payment settings...",
  "refreshSettings": "Refresh settings",
  "notConnected": "Not connected",
  "notConnectedDescription": "Connect your Paymob merchant account to enable online appointment payments.",
  "needsAttention": "Needs attention",
  "needsAttentionDescription": "Your Paymob payment configuration requires review.",
  "disabled": "Disabled",
  "disabledDescription": "Online payments are currently disabled for this clinic.",
  "reviewSettings": "Review Settings",
  "viewSetupGuide": "View Setup Guide",
  "howItWorks": "How it works",
  "enable": "Enable Online Payments",
  "configurationIssue": "Paymob connection needs attention",
  "configurationIssueDescription": "Clinova could not complete a recent Paymob payment request using this clinic's payment configuration. Please review your Paymob credentials and integration settings.",
  "issues": {
    "PaymobAuthenticationFailed": {
      "title": "Paymob configuration needs attention",
      "message": "Clinova was unable to authenticate a recent payment request with your Paymob account. Please review the credentials connected to this clinic.",
      "action": "Review Credentials"
    },
    "InvalidIntegration": {
      "title": "Payment integration needs attention",
      "message": "The Paymob payment integration configured for this clinic could not be used for a recent payment request. Please verify the Integration ID in your Paymob Dashboard.",
      "action": "Review Integration"
    },
    "HmacVerificationFailed": {
      "title": "Payment notification verification needs attention",
      "message": "Clinova was unable to verify a recent payment notification from Paymob. Please review the HMAC Secret configured for this clinic.",
      "action": "Review HMAC Settings"
    },
    "ProviderUnavailable": {
      "title": "Paymob account is currently unavailable",
      "message": "Your Paymob account may require additional verification or configuration before online payments can be processed.",
      "action": "Open Paymob Setup Guide"
    },
    "UnknownConfigurationIssue": {
      "title": "Paymob connection needs attention",
      "message": "Clinova could not complete a recent Paymob payment request using this clinic's payment configuration. Please review your Paymob credentials and integration settings.",
      "action": "Review Paymob Settings"
    }
  },
  "manageUnavailable": "Your saved Paymob configuration could not be loaded. No credentials have been changed.",
  "noSavedConfiguration": "There is no saved Paymob configuration for this clinic.",
  "metadataUnavailable": "Not available",
  "viewSettings": "View Online Payments",
  "helpTitle": "Need help?",
  "helpDescription": "Follow a short guide to prepare your Paymob account and connect it to Clinova.",
  "browseHelp": "Browse Paymob setup guides",
  "backHelp": "All Paymob guides",
  "tutorialNotFound": "This setup guide is not available.",
  "clinovaScreenshot": "Clinova Screenshot — {{section}}",
  "clinovaScreenshotCaption": "Example: Clinova → {{section}}",
  "clinovaScreenshotDescription": "This is a placeholder. The actual Clinova screenshot will be added here.",
  "tutorials": {
    "create-account": {
      "title": "How to create a Paymob account",
      "intro": "If you don't already have a Paymob merchant account, create one directly through Paymob and complete the required business verification.",
      "steps": [
        "Open the official Paymob website and follow its account registration process for your region.",
        "Complete the business verification and onboarding requested by Paymob. Clinova does not create this merchant account for you.",
        "Sign in to your Paymob Dashboard. Use Test credentials for testing; use Live credentials only after the required approval."
      ],
      "screenshot": "Account setup"
    },
    "api-keys": {
      "title": "How to find your API Keys",
      "intro": "After signing in to your Paymob Dashboard, you'll need the credentials below to connect your merchant account to Clinova.",
      "steps": [
        "Sign in to your Paymob Dashboard and open Settings.",
        "Open API Keys. Some dashboard layouts place this under Developers; follow the labels shown in your dashboard.",
        "Find Public Key, Secret Key, HMAC Secret, and ApiKey. These are four separate credentials; enter each into its matching Clinova field."
      ],
      "screenshot": "API Keys"
    },
    "hmac-secret": {
      "title": "How to find your HMAC Secret",
      "intro": "Your HMAC Secret is used by Clinova's backend to verify that payment callbacks received from Paymob are authentic and have not been modified.",
      "steps": [
        "Sign in to your Paymob Dashboard and open Settings → API Keys (under Developers where shown).",
        "Find HMAC Secret. It is separate from Secret Key and ApiKey.",
        "Enter it directly into the HMAC Secret field in Clinova. Never send it through email, WhatsApp, screenshots, or chat."
      ],
      "screenshot": "API Keys"
    },
    "api-key": {
      "title": "How to find your ApiKey",
      "intro": "Your ApiKey is a Paymob integration credential that allows Clinova's secure backend to communicate with your Paymob merchant account.",
      "steps": [
        "Sign in to your Paymob Dashboard and open Settings → API Keys (under Developers where shown).",
        "Find API Key. Do not use the Public Key, Secret Key, or Card Integration ID in its place.",
        "Enter this value directly into the ApiKey field in Clinova. Treat it as a sensitive credential and never share it publicly."
      ],
      "screenshot": "API Keys"
    },
    "card-integration": {
      "title": "How to find your Card Integration ID",
      "intro": "This identifies the Paymob payment integration Clinova should use for card payments.",
      "steps": [
        "Open Paymob Dashboard → Settings → Payment Integrations.",
        "Select the environment you intend to connect: Test or Live.",
        "Find the Card integration and copy its Integration ID into the Card Integration ID field in Clinova."
      ],
      "screenshot": "Payment Integrations"
    },
    "test-live": {
      "title": "Test vs Live credentials",
      "intro": "Test and Live credentials are different. Make sure you are copying credentials from the environment you intend to connect.",
      "steps": [
        "For development and testing, use Test credentials. They do not process real money.",
        "For real patient payments, use Live credentials after your Paymob account has completed the required verification and approval process.",
        "Copy the keys and Card Integration ID from the same intended environment."
      ],
      "screenshot": "Payment Integrations"
    },
    "why-credentials": {
      "title": "Why does Clinova need these credentials?",
      "intro": "Clinova needs the Paymob integration credentials to securely connect your clinic's Paymob merchant account to the Clinova payment system.",
      "steps": [
        "Connect your own Paymob merchant account to receive appointment deposits through it. Clinova does not need your Paymob login email or password.",
        "The Secret Key allows the secure backend to create payment intentions; HMAC Secret allows it to authenticate payment notifications.",
        "ApiKey supports secure backend communication with Paymob. Public Key identifies the environment, and Card Integration ID identifies the card payment integration.",
        "Enter the credentials directly into Clinova. Patients never see sensitive credentials."
      ],
      "screenshot": "Connect Paymob"
    },
    "credential-security": {
      "title": "How Clinova protects sensitive credentials",
      "intro": "Your payment credentials are protected",
      "steps": [
        "Enter Secret Key, HMAC Secret, and ApiKey only into the secure Clinova form. Never send them through email, WhatsApp, screenshots, or chat.",
        "Sensitive credentials are encrypted before being stored and are used only by Clinova’s secure backend.",
        "Saved secrets are never shown in the interface or sent to patients. Manage shows fixed masks and lets you explicitly enter replacement values."
      ],
      "screenshot": "Credential security"
    },
    "update-disconnect": {
      "title": "How to update or disconnect Paymob",
      "intro": "Review your saved settings and choose the credentials you want to replace without revealing existing secrets.",
      "steps": [
        "Open your clinic’s Online Payments settings and choose Manage.",
        "Select Replace beside a credential to enter a new value. Leave other fields unchanged to keep their saved values. Saving updates is not available from this page yet.",
        "Return to Online Payments to find Disable. Disabling or disconnecting is not available yet; opening this action does not change your configuration."
      ],
      "screenshot": "Online Payments"
    }
  }
} as const

export const paymobExperienceAr = {
  "guideTitle": "احصل على بيانات الربط",
  "backConnect": "العودة إلى ربط Paymob",
  "openGuide": "عرض دليل بيانات الربط",
  "requiredCredentials": "خمسة بيانات لربط واحد",
  "guideIntro": "اعثر على بيانات الربط الخمسة في لوحة تحكم Paymob قبل إدخالها في Clinova.",
  "apiSection": "API Keys",
  "integrationSection": "Card Integration ID",
  "integrationSteps": [
    "افتح Paymob Dashboard → Settings → Payment Integrations.",
    "اختر الوضع المناسب: Test أو Live.",
    "ابحث عن تكامل البطاقات Card.",
    "انسخ Integration ID."
  ],
  "guideFinish": "بعد الحصول على البيانات الخمسة، عُد إلى صفحة ربط Paymob لإدخالها مباشرة في النموذج الآمن.",
  "zoomImage": "تكبير لقطة الشاشة",
  "zoomImageLabel": "تكبير لقطة شاشة {{section}}",
  "imageFit": "ملاءمة الصورة",
  "imageActual": "عرض بالحجم الأصلي",
  "imageUnavailable": "تعذّر تحميل لقطة الشاشة. يمكنك متابعة التعليمات المكتوبة.",
  "fieldRequired": "أدخل {{field}}.",
  "validationTitle": "راجع الحقول المحددة",
  "consentRequired": "أكّد الموافقتين قبل الربط.",
  "replace": "استبدال {{field}}",
  "keepExisting": "الاحتفاظ بقيمة {{field}} الحالية",
  "savedCredential": "بيانات محفوظة — القيمة مخفية",
  "newValue": "أدخل قيمة جديدة لـ {{field}}",
  "updateUnavailable": "تحديث بيانات الربط غير متاح من هذه الصفحة بعد. لم تتغير إعداداتك الحالية.",
  "updateTitle": "تحديث بيانات ربط Paymob",
  "updateDescription": "استبدل فقط البيانات التي تريد تغييرها. تظل البيانات الحساسة الحالية محمية ولا تُعرض مطلقًا.",
  "update": "تحديث بيانات الربط",
  "updated": "تم تحديث إعدادات Paymob بنجاح",
  "updatedDescription": "تم حفظ بيانات ربط Paymob المحدثة بأمان. تظل البيانات التي لم تتغير محمية.",
  "noChanges": "اختر بيانًا واحدًا على الأقل لاستبداله.",
  "unchanged": "سيتم الاحتفاظ بالبيانات التي لم تتغير.",
  "cancelUpdate": "إلغاء التغييرات",
  "backSettings": "العودة إلى المدفوعات الإلكترونية",
  "updateConsent": "أؤكد أنني مخوّل بتحديث إعدادات Paymob لهذه العيادة.",
  "savedValue": "القيمة الحالية",
  "replaceHint": "اختر استبدال لإدخال قيمة جديدة. لا يمكن إظهار القيمة المحفوظة.",
  "securityShort": "تُدخل بيانات الربط مباشرة في Clinova. لا يراها المرضى مطلقًا.",
  "settingsTitle": "المدفوعات الإلكترونية",
  "settingsDescription": "إدارة حساب التاجر لدى Paymob المرتبط بعيادتك.",
  "provider": "مزود الدفع",
  "paymentMethod": "طريقة الدفع",
  "integration": "التكامل",
  "card": "البطاقات",
  "lastUpdated": "آخر تحديث",
  "manage": "إدارة",
  "setupGuide": "دليل الإعداد",
  "disable": "تعطيل",
  "connected": "متصل",
  "connectedDescription": "المدفوعات الإلكترونية مفعّلة لهذه العيادة.",
  "savedMeaning": "متصل يعني أن إعداداتك محفوظة. ولا يعني التحقق من بيانات الربط لدى Paymob.",
  "disableUnavailable": "تعطيل المدفوعات الإلكترونية غير متاح من هذه الصفحة بعد. لم تتغير إعداداتك.",
  "enableUnavailable": "تفعيل المدفوعات الإلكترونية غير متاح من هذه الصفحة بعد. لم تتغير إعداداتك.",
  "actionUnavailable": "هذا الإجراء غير متاح بعد",
  "statusUnavailable": "تعذّر تحميل إعدادات الدفع. حاول مرة أخرى للاطلاع على الإعدادات الحالية.",
  "settingsLoading": "جارٍ تحميل إعدادات المدفوعات الإلكترونية...",
  "refreshSettings": "تحديث الإعدادات",
  "notConnected": "غير متصل",
  "notConnectedDescription": "اربط حساب التاجر لدى Paymob لتفعيل المدفوعات الإلكترونية للمواعيد.",
  "needsAttention": "يحتاج إلى مراجعة",
  "needsAttentionDescription": "تحتاج إعدادات الدفع لدى Paymob إلى مراجعتك.",
  "disabled": "معطّل",
  "disabledDescription": "المدفوعات الإلكترونية معطّلة حاليًا لهذه العيادة.",
  "reviewSettings": "مراجعة الإعدادات",
  "viewSetupGuide": "عرض دليل الإعداد",
  "howItWorks": "كيف يعمل الربط",
  "enable": "تفعيل المدفوعات الإلكترونية",
  "configurationIssue": "اتصال Paymob يحتاج إلى مراجعة",
  "configurationIssueDescription": "تعذّر على Clinova إكمال طلب دفع حديث لدى Paymob باستخدام إعدادات هذه العيادة. يُرجى مراجعة بيانات الربط وإعدادات التكامل.",
  "issues": {
    "PaymobAuthenticationFailed": {
      "title": "إعدادات Paymob تحتاج إلى مراجعة",
      "message": "تعذّر على Clinova مصادقة طلب دفع حديث مع حسابك لدى Paymob. يُرجى مراجعة بيانات الربط الخاصة بهذه العيادة.",
      "action": "مراجعة بيانات الربط"
    },
    "InvalidIntegration": {
      "title": "تكامل الدفع يحتاج إلى مراجعة",
      "message": "تعذّر استخدام تكامل Paymob المحدد لهذه العيادة في طلب دفع حديث. يُرجى مراجعة Integration ID في لوحة تحكم Paymob.",
      "action": "مراجعة التكامل"
    },
    "HmacVerificationFailed": {
      "title": "التحقق من إشعارات الدفع يحتاج إلى مراجعة",
      "message": "تعذّر على Clinova التحقق من إشعار دفع حديث من Paymob. يُرجى مراجعة HMAC Secret الخاص بهذه العيادة.",
      "action": "مراجعة إعدادات HMAC"
    },
    "ProviderUnavailable": {
      "title": "حساب Paymob غير متاح حاليًا",
      "message": "قد يتطلب حسابك لدى Paymob إجراءات تحقق أو إعدادات إضافية قبل معالجة المدفوعات الإلكترونية.",
      "action": "فتح دليل إعداد Paymob"
    },
    "UnknownConfigurationIssue": {
      "title": "اتصال Paymob يحتاج إلى مراجعة",
      "message": "تعذّر على Clinova إكمال طلب دفع حديث لدى Paymob باستخدام إعدادات هذه العيادة. يُرجى مراجعة بيانات الربط وإعدادات التكامل.",
      "action": "مراجعة إعدادات Paymob"
    }
  },
  "manageUnavailable": "تعذّر تحميل إعدادات Paymob المحفوظة. لم تتغير أي بيانات ربط.",
  "noSavedConfiguration": "لا توجد إعدادات Paymob محفوظة لهذه العيادة.",
  "metadataUnavailable": "غير متاح",
  "viewSettings": "عرض المدفوعات الإلكترونية",
  "helpTitle": "هل تحتاج إلى مساعدة؟",
  "helpDescription": "اتبع دليلًا مختصرًا لتجهيز حساب Paymob وربطه بمنصة Clinova.",
  "browseHelp": "تصفح أدلة إعداد Paymob",
  "backHelp": "جميع أدلة Paymob",
  "tutorialNotFound": "دليل الإعداد هذا غير متاح.",
  "clinovaScreenshot": "لقطة شاشة Clinova — {{section}}",
  "clinovaScreenshotCaption": "مثال: Clinova ← {{section}}",
  "clinovaScreenshotDescription": "هذا موضع مخصص للصورة. ستُضاف لقطة الشاشة الفعلية لمنصة Clinova هنا لاحقًا.",
  "tutorials": {
    "create-account": {
      "title": "كيفية إنشاء حساب Paymob",
      "intro": "إذا لم يكن لديك حساب تاجر لدى Paymob، فأنشئ حسابًا مباشرة من خلال Paymob وأكمل إجراءات التحقق المطلوبة لنشاطك التجاري.",
      "steps": [
        "افتح موقع Paymob الرسمي واتبع إجراءات تسجيل الحساب الخاصة ببلدك.",
        "أكمل إجراءات التحقق من النشاط التجاري والإعداد المطلوبة من Paymob. لا تُنشئ Clinova حساب التاجر نيابةً عنك.",
        "سجّل الدخول إلى لوحة تحكم Paymob. استخدم بيانات Test للاختبار، وبيانات Live بعد الموافقة المطلوبة فقط."
      ],
      "screenshot": "إعداد الحساب"
    },
    "api-keys": {
      "title": "كيفية العثور على API Keys",
      "intro": "بعد تسجيل الدخول إلى لوحة تحكم Paymob، ستحتاج إلى البيانات التالية لربط حساب التاجر بمنصة Clinova.",
      "steps": [
        "سجّل الدخول إلى لوحة تحكم Paymob وافتح Settings.",
        "افتح API Keys. يظهر هذا القسم ضمن Developers في بعض تخطيطات اللوحة؛ اتبع المسميات الظاهرة لديك.",
        "اعثر على Public Key وSecret Key وHMAC Secret وApiKey. هذه أربعة بيانات منفصلة؛ أدخل كل قيمة في الحقل المطابق في Clinova."
      ],
      "screenshot": "API Keys"
    },
    "hmac-secret": {
      "title": "كيفية العثور على HMAC Secret",
      "intro": "يستخدم خادم Clinova قيمة HMAC Secret للتحقق من أن إشعارات الدفع الواردة من Paymob أصلية ولم يتم تعديلها.",
      "steps": [
        "سجّل الدخول إلى لوحة تحكم Paymob وافتح Settings → API Keys، ضمن Developers إذا ظهر.",
        "ابحث عن HMAC Secret. وهو منفصل عن Secret Key وApiKey.",
        "أدخله مباشرة في حقل HMAC Secret في Clinova. لا ترسله عبر البريد الإلكتروني أو واتساب أو لقطات الشاشة أو الدردشة."
      ],
      "screenshot": "API Keys"
    },
    "api-key": {
      "title": "كيفية العثور على ApiKey",
      "intro": "ApiKey هو أحد بيانات الربط لدى Paymob، ويسمح لخادم Clinova الآمن بالتواصل مع حساب التاجر الخاص بك لدى Paymob.",
      "steps": [
        "سجّل الدخول إلى لوحة تحكم Paymob وافتح Settings → API Keys، ضمن Developers إذا ظهر.",
        "ابحث عن API Key. لا تستخدم Public Key أوSecret Key أوCard Integration ID بدلًا منه.",
        "أدخل القيمة مباشرة في حقل ApiKey في Clinova. تعامل معها كبيانات حساسة ولا تشاركها علنًا."
      ],
      "screenshot": "API Keys"
    },
    "card-integration": {
      "title": "كيفية العثور على Card Integration ID",
      "intro": "يحدد تكامل الدفع لدى Paymob الذي ينبغي أن تستخدمه Clinova لمدفوعات البطاقات.",
      "steps": [
        "افتح Paymob Dashboard → Settings → Payment Integrations.",
        "اختر البيئة التي تريد ربطها: Test أوLive.",
        "ابحث عن تكامل Card وانسخ Integration ID إلى حقل Card Integration ID في Clinova."
      ],
      "screenshot": "Payment Integrations"
    },
    "test-live": {
      "title": "بيانات Test وLive",
      "intro": "بيانات Test وLive مختلفة. تأكد من نسخ البيانات من البيئة التي تريد ربطها.",
      "steps": [
        "استخدم بيانات Test للتطوير والاختبار. هذه البيانات لا تعالج أموالًا حقيقية.",
        "استخدم بيانات Live لمدفوعات المرضى الفعلية بعد اكتمال إجراءات التحقق والموافقة المطلوبة لحسابك لدى Paymob.",
        "انسخ المفاتيح ومعرّف Card Integration ID من البيئة نفسها التي تريد ربطها."
      ],
      "screenshot": "Payment Integrations"
    },
    "why-credentials": {
      "title": "لماذا تحتاج Clinova إلى بيانات الربط؟",
      "intro": "تحتاج Clinova إلى بيانات تكامل Paymob لربط حساب التاجر الخاص بعيادتك بنظام المدفوعات في Clinova بأمان.",
      "steps": [
        "اربط حساب التاجر الخاص بك لدى Paymob لاستقبال مقدم حجز المواعيد من خلاله. لا تحتاج Clinova بريد تسجيل الدخول أو كلمة المرور لدى Paymob.",
        "يسمح Secret Key للخادم الآمن بإنشاء طلبات الدفع، وتتيح قيمة HMAC Secret التحقق من صحة إشعارات الدفع.",
        "تدعم قيمة ApiKey الاتصال الآمن مع Paymob على الخادم. يحدد Public Key البيئة، ويحدد Card Integration ID تكامل مدفوعات البطاقات.",
        "أدخل البيانات مباشرة في Clinova. لا يرى المرضى البيانات الحساسة مطلقًا."
      ],
      "screenshot": "ربط Paymob"
    },
    "credential-security": {
      "title": "كيف تحمي Clinova بيانات الربط الحساسة",
      "intro": "بيانات الدفع الخاصة بك محمية",
      "steps": [
        "أدخل Secret Key وHMAC Secret وApiKey في نموذج Clinova الآمن فقط. لا ترسلها عبر البريد الإلكتروني أو واتساب أو لقطات الشاشة أو الدردشة.",
        "تُشفّر البيانات الحساسة قبل تخزينها، وتُستخدم فقط على خادم Clinova الآمن.",
        "لا تُعرض البيانات السرية المحفوظة في الواجهة ولا تُرسل إلى المرضى. تعرض صفحة الإدارة أقنعة ثابتة وتتيح إدخال قيم بديلة صراحةً."
      ],
      "screenshot": "حماية بيانات الربط"
    },
    "update-disconnect": {
      "title": "كيفية تحديث Paymob أو إلغاء ربطه",
      "intro": "راجع إعداداتك المحفوظة واختر البيانات التي تريد استبدالها دون إظهار القيم السرية الحالية.",
      "steps": [
        "افتح إعدادات المدفوعات الإلكترونية للعيادة واختر إدارة.",
        "اختر استبدال بجانب أحد البيانات لإدخال قيمة جديدة. اترك الحقول الأخرى دون تغيير للاحتفاظ بقيمها المحفوظة. حفظ التحديثات غير متاح من هذه الصفحة بعد.",
        "عُد إلى المدفوعات الإلكترونية للعثور على تعطيل. التعطيل وإلغاء الربط غير متاحين بعد؛ فتح هذا الإجراء لا يغير إعداداتك."
      ],
      "screenshot": "المدفوعات الإلكترونية"
    }
  }
} satisfies Record<keyof typeof paymobExperienceEn, unknown>
