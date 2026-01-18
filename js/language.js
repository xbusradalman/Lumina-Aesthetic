// Dil Yönetim Sistemi
class LanguageManager {
  constructor() {
    this.currentLanguage = localStorage.getItem('selectedLanguage') || 'en';
    this.translations = {};
    this.supportedLanguages = {
      'en': 'English',
      'tr': 'Türkçe',
      'fr': 'Français',
      'de': 'Deutsch',
      'ar': 'العربية'
    };
  }

  // Dil dosyasını yükle
  async loadLanguage(lang) {
    try {
      // Önce embedded translations'dan yükle (CORS sorununu önlemek için)
      if (typeof translationsData !== 'undefined' && translationsData[lang]) {
        this.translations[lang] = translationsData[lang];
        console.log(`Dil yüklendi (embedded): ${lang}`, Object.keys(translationsData[lang]));
        return this.translations[lang];
      }
      
      // Eğer embedded yoksa, fetch ile dene (sadece HTTP/HTTPS için)
      if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        const langPath = `js/languages/${lang}.json`;
        console.log(`Dil dosyası yükleniyor: ${langPath}`);
        
        const response = await fetch(langPath, {
          cache: 'no-cache',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Dil dosyası yüklenemedi: ${lang} (${response.status} ${response.statusText})`);
        }
        
        const data = await response.json();
        this.translations[lang] = data;
        console.log(`Dil yüklendi (fetch): ${lang}`, Object.keys(data));
        return this.translations[lang];
      } else {
        // file:// protokolü için embedded kullan
        throw new Error('file:// protokolü için embedded translations kullanılmalı');
      }
    } catch (error) {
      console.error('Dil yükleme hatası:', error);
      // Hata durumunda İngilizce'ye geri dön
      if (lang !== 'en') {
        console.log('İngilizce\'ye geri dönülüyor...');
        return this.loadLanguage('en');
      }
      return null;
    }
  }

  // Metni çevir
  translate(key, params = {}) {
    // Eğer dil dosyası yüklenmemişse, anahtarı döndür
    if (!this.translations[this.currentLanguage]) {
      console.warn(`Dil dosyası yüklenmemiş: ${this.currentLanguage}, anahtar: ${key}`);
      return key;
    }

    const keys = key.split('.');
    let value = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Çeviri anahtarı bulunamadı: ${key}`);
        return key; // Anahtar bulunamazsa anahtarı döndür
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Çeviri değeri string değil: ${key}`);
      return key;
    }

    // Parametreleri değiştir (örn: {inner} -> Inner)
    if (params && Object.keys(params).length > 0) {
      Object.keys(params).forEach(param => {
        value = value.replace(`{${param}}`, params[param]);
      });
    }

    return value;
  }

  // Dil değiştir
  async changeLanguage(lang) {
    if (!this.supportedLanguages[lang]) {
      console.error('Desteklenmeyen dil:', lang);
      return;
    }

    console.log(`Dil değiştiriliyor: ${this.currentLanguage} -> ${lang}`);

    // Dil dosyasını yükle (eğer yüklenmemişse)
    if (!this.translations[lang]) {
      console.log('Dil dosyası yükleniyor...');
      await this.loadLanguage(lang);
    }

    this.currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);

    // HTML lang attribute'unu güncelle
    document.documentElement.lang = lang;

    // Arapça için RTL (Right-to-Left) ayarla
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.body.style.direction = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
      document.body.style.direction = 'ltr';
    }

    // Tüm sayfayı güncelle
    console.log('Sayfa güncelleniyor...');
    this.updatePage();
    
    console.log('Dil değiştirme tamamlandı');
  }

  // Sayfadaki tüm metinleri güncelle
  updatePage() {
    // Eğer dil dosyası yüklenmemişse bekle
    if (!this.translations[this.currentLanguage]) {
      console.warn('Dil dosyası henüz yüklenmemiş, güncelleme atlanıyor');
      return;
    }

    console.log(`Sayfa güncelleniyor: ${this.currentLanguage}`, this.translations[this.currentLanguage]);

    // data-i18n attribute'u olan tüm elementleri bul
    const elements = document.querySelectorAll('[data-i18n]');
    console.log(`Bulunan çeviri elementi: ${elements.length}`);
    
    let updatedCount = 0;
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      if (!key) return;

      const params = {};
      
      // data-i18n-params attribute'u varsa parametreleri al
      const paramsAttr = element.getAttribute('data-i18n-params');
      if (paramsAttr) {
        try {
          Object.assign(params, JSON.parse(paramsAttr));
        } catch (e) {
          console.error('Parametre parse hatası:', e);
        }
      }

      const translation = this.translate(key, params);
      
      // Eğer çeviri anahtar ile aynıysa, çeviri bulunamadı demektir
      if (translation === key) {
        console.warn(`Çeviri bulunamadı: ${key}`);
        return; // Geçersiz anahtar, atla
      }
      
      // Element tipine göre güncelle
      if (element.tagName === 'INPUT') {
        if (element.type === 'submit' || element.type === 'button') {
          element.value = translation;
          updatedCount++;
        } else {
          // Placeholder için ayrı attribute varsa onu kullanma
          if (!element.hasAttribute('data-i18n-placeholder')) {
            element.placeholder = translation;
            updatedCount++;
          }
        }
      } else if (element.tagName === 'TEXTAREA') {
        if (!element.hasAttribute('data-i18n-placeholder')) {
          element.placeholder = translation;
          updatedCount++;
        }
      } else if (element.tagName === 'IMG') {
        element.alt = translation;
        updatedCount++;
      } else if (element.tagName === 'A' && element.hasAttribute('href')) {
        // Link için sadece içerik güncelle
        const textOnly = translation.replace(/<[^>]*>/g, ''); // HTML tag'lerini temizle
        if (element.textContent.trim() !== textOnly.trim()) {
          element.textContent = textOnly;
          updatedCount++;
        }
      } else {
        // \n karakterlerini <br> ile değiştir
        // HTML içeriğini doğrudan kullan (zaten HTML tag'leri içerebilir)
        const newContent = translation.replace(/\n/g, '<br>');
        if (element.innerHTML !== newContent) {
          element.innerHTML = newContent;
          updatedCount++;
        }
      }
    });

    // data-i18n-placeholder attribute'u olan elementleri güncelle
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translation = this.translate(key);
      if (translation !== key) {
        element.placeholder = translation;
        updatedCount++;
      }
    });

    // Özel alanları güncelle (title, meta description vb.)
    this.updateSpecialElements();
    
    console.log(`Sayfa güncellemesi tamamlandı: ${updatedCount} element güncellendi`);
  }

  // Özel elementleri güncelle (title, meta vb.)
  updateSpecialElements() {
    const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
    if (titleKey) {
      document.title = this.translate(titleKey);
    }

    // Meta description güncelle
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      const descKey = metaDesc.getAttribute('data-i18n');
      if (descKey) {
        metaDesc.content = this.translate(descKey);
      }
    }
  }

  // Dil seçici dropdown'ı oluştur
  createLanguageSelector() {
    const selector = document.createElement('div');
    selector.className = 'language-selector dropdown';
    selector.id = 'languageSelectorContainer';
    selector.style.position = 'relative';
    selector.innerHTML = `
      <button class="btn btn-sm btn-outline-primary dropdown-toggle" type="button" 
              id="languageDropdown" data-bs-toggle="dropdown" aria-expanded="false">
        <i class="bi bi-globe me-1"></i>
        <span class="current-lang">${this.supportedLanguages[this.currentLanguage]}</span>
      </button>
      <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="languageDropdown">
        ${Object.keys(this.supportedLanguages).map(lang => `
          <li>
            <a class="dropdown-item ${lang === this.currentLanguage ? 'active' : ''}" 
               href="#" data-lang="${lang}">
              ${this.supportedLanguages[lang]}
            </a>
          </li>
        `).join('')}
      </ul>
    `;

    // Event listener'ları ekle
    this.attachLanguageSelectorEvents(selector);

    return selector;
  }

  // Başlat
  async init() {
    try {
      console.log('LanguageManager başlatılıyor...', this.currentLanguage);
      
      // Mevcut dili yükle
      const loaded = await this.loadLanguage(this.currentLanguage);
      if (!loaded) {
        console.error('Dil dosyası yüklenemedi');
        return;
      }
      
      console.log('Dil dosyası yüklendi:', Object.keys(this.translations[this.currentLanguage]));
      
      // HTML lang attribute'unu ayarla
      document.documentElement.lang = this.currentLanguage;

      // Arapça için RTL (Right-to-Left) ayarla
      if (this.currentLanguage === 'ar') {
        document.documentElement.dir = 'rtl';
        document.body.style.direction = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
        document.body.style.direction = 'ltr';
      }

      // Dil seçiciyi header'a ekle (veya mevcut olanı güncelle)
      this.addLanguageSelectorToHeader();

      // Sayfayı güncelle
      this.updatePage();
      
      console.log('LanguageManager başlatıldı');
    } catch (error) {
      console.error('Dil yöneticisi başlatma hatası:', error);
    }
  }

  // Dil seçiciyi header'a ekle
  addLanguageSelectorToHeader() {
    // HTML'de zaten varsa, sadece event listener'ları ekle
    const existingSelector = document.querySelector('#languageSelectorContainer');
    if (existingSelector) {
      console.log('Dil seçici HTML\'de bulundu, event listener\'lar ekleniyor...');
      this.attachLanguageSelectorEvents(existingSelector);
      this.updateLanguageSelectorDisplay();
      return;
    }

    // Eğer HTML'de yoksa, oluştur ve ekle
    // Header'daki top-bar içine ekle
    const topBarContainer = document.querySelector('.top-bar .d-flex.justify-content-between');
    if (topBarContainer) {
      const socialBox = topBarContainer.querySelector('.social-box');
      if (socialBox) {
        const selector = this.createLanguageSelector();
        selector.classList.add('d-flex', 'align-items-center', 'me-3');
        topBarContainer.insertBefore(selector, socialBox);
        console.log('Dil seçici header\'a eklendi');
        return;
      }
    }

    // Alternatif: Navbar'a ekle
    const navbar = document.querySelector('.navbar .container-fluid');
    if (navbar) {
      const navbarToggler = navbar.querySelector('.navbar-toggler');
      if (navbarToggler && navbarToggler.parentElement) {
        const selector = this.createLanguageSelector();
        selector.classList.add('ms-auto', 'me-3');
        navbarToggler.parentElement.insertBefore(selector, navbarToggler);
        console.log('Dil seçici navbar\'a eklendi');
        return;
      }
    }

    console.warn('Dil seçici eklenemedi: uygun konum bulunamadı');
  }

  // Mevcut dil seçiciye event listener'ları ekle
  attachLanguageSelectorEvents(container) {
    // Event delegation kullan - container'a bir tane listener ekle
    container.addEventListener('click', async (e) => {
      // Sadece data-lang attribute'lu linklere tıklandığında çalış
      const target = e.target.closest('a[data-lang]');
      if (!target) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const lang = target.getAttribute('data-lang');
      console.log('Dil seçildi:', lang);
      
      if (lang && this.supportedLanguages[lang]) {
        await this.handleLanguageChange(lang);
      } else {
        console.error('Geçersiz dil kodu:', lang);
      }
    });
    
    const items = container.querySelectorAll('a[data-lang]');
    console.log(`${items.length} dil seçeneği bulundu, event delegation aktif`);
  }

  // Dil değiştirme işlemini yönet
  async handleLanguageChange(lang) {
    try {
      console.log('Dil değiştiriliyor:', lang);
      await this.changeLanguage(lang);
      this.updateLanguageSelectorDisplay();
      
      // Bootstrap dropdown'ı kapat
      const dropdownElement = document.querySelector('#languageDropdown');
      if (dropdownElement) {
        // Bootstrap 5 için dropdown'ı kapat
        if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
          const dropdown = bootstrap.Dropdown.getInstance(dropdownElement);
          if (dropdown) {
            dropdown.hide();
          }
        }
        // Manuel olarak aria-expanded'ı false yap
        dropdownElement.setAttribute('aria-expanded', 'false');
        // Dropdown menu'yu gizle
        const dropdownMenu = document.querySelector('#languageSelectorContainer .dropdown-menu');
        if (dropdownMenu) {
          dropdownMenu.classList.remove('show');
        }
      }
    } catch (error) {
      console.error('Dil değiştirme hatası:', error);
    }
  }

  // Dil seçici görünümünü güncelle
  updateLanguageSelectorDisplay() {
    const container = document.querySelector('#languageSelectorContainer');
    if (container) {
      const currentLangSpan = container.querySelector('.current-lang');
      if (currentLangSpan) {
        currentLangSpan.textContent = this.supportedLanguages[this.currentLanguage];
      }

      container.querySelectorAll('[data-lang]').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-lang') === this.currentLanguage) {
          item.classList.add('active');
        }
      });
    }
  }
}

// Global instance oluştur
let languageManager;

// Sayfa yüklendiğinde başlat
function initLanguageManager() {
  languageManager = new LanguageManager();
  // Global erişim için window'a ekle
  window.languageManager = languageManager;
  
  // Bootstrap yüklendikten sonra başlat
  if (typeof bootstrap !== 'undefined') {
    languageManager.init().catch(error => {
      console.error('Dil yöneticisi başlatılamadı:', error);
    });
  } else {
    // Bootstrap yüklenene kadar bekle
    window.addEventListener('load', () => {
      setTimeout(() => {
        languageManager.init().catch(error => {
          console.error('Dil yöneticisi başlatılamadı:', error);
        });
      }, 100);
    });
  }
}

// DOM yüklendiğinde başlat
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguageManager);
} else {
  // DOM zaten yüklü
  initLanguageManager();
}
