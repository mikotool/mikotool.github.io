document.addEventListener('DOMContentLoaded', function() {
  // ここから変更不要
  const BASE_KEY = window.CARD_KEY_BASE || window.CARD_KEY || 'scamCards';
  const hasSubMenu = !!document.querySelector('.sub-menu');
  let currentSub = '';

  // ✅ 修正版：localStorageを最優先し、無ければ最初のボタンを選択
  function decideCurrentSub() {
    if (!hasSubMenu) return '';
    // まず保存されているサブメニューを取得
    const fromStorage = localStorage.getItem('currentSubMenu');
    if (fromStorage) {
      const btn = document.querySelector(`.sub-btn[data-sub="${fromStorage}"]`);
      if (btn) {
        document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        return btn.dataset.sub;
      }
    }
    // 保存がなかった場合や無効な場合、最初のボタンを選択
    const firstBtn = document.querySelector('.sub-btn');
    if (firstBtn) {
      document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
      firstBtn.classList.add('active');
      localStorage.setItem('currentSubMenu', firstBtn.dataset.sub);
      return firstBtn.dataset.sub;
    }
    return '';
  }

  currentSub = decideCurrentSub();

  function getStorageKey() {
    return hasSubMenu ? BASE_KEY + currentSub : BASE_KEY;
  }

  let cards = [];

  function loadCards() {
    cards = JSON.parse(localStorage.getItem(getStorageKey()) || '[]');
    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    cards.forEach(card => addCardToDom(card.title, card.url, card.imageData));
  }

  function addCardToDom(title, url, imageData) {
    const container = document.getElementById('cards-container');
    const card = document.createElement('div');
    card.className = 'scam-card';
    const imageUrl = imageData || 'https://via.placeholder.com/400x200?text=NO+IMAGE';
    card.innerHTML = `
      <div class="card-image"><img src="${imageUrl}" alt="プレビュー"></div>
      <div class="card-title">${title}</div>
      <a href="${url}" target="_blank" class="card-link"></a>
    `;
    container.appendChild(card);
  }

  function saveCard(title, url, imageData) {
    let currentCards = JSON.parse(localStorage.getItem(getStorageKey()) || '[]');
    currentCards.push({ title, url, imageData });
    localStorage.setItem(getStorageKey(), JSON.stringify(currentCards));
    cards = currentCards;
  }

  document.getElementById('add-btn').onclick = function() {
    document.getElementById('add-form').style.display = 'flex';
    document.getElementById('site-title').focus();
  };
  document.getElementById('cancel-btn').onclick = closeForm;
  document.getElementById('submit-btn').onclick = function() {
    const title = document.getElementById('site-title').value.trim();
    const url = document.getElementById('site-url').value.trim();
    if (!title || !url) return alert('タイトルとURLを入力してください');
    const file = document.getElementById('site-image').files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        addCardToDom(title, url, e.target.result);
        saveCard(title, url, e.target.result);
        closeForm();
      };
      reader.readAsDataURL(file);
    } else {
      addCardToDom(title, url, null);
      saveCard(title, url, null);
      closeForm();
    }
  };

  function closeForm() {
    document.getElementById('add-form').style.display = 'none';
    document.getElementById('site-title').value = '';
    document.getElementById('site-url').value = '';
    document.getElementById('site-image').value = '';
    document.getElementById('loading').style.display = 'none';
  }

  if (hasSubMenu) {
    document.querySelectorAll('.sub-btn').forEach(function(btn) {
      btn.onclick = function() {
        document.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSub = btn.dataset.sub;
        localStorage.setItem('currentSubMenu', currentSub);
        loadCards();
      };
    });
  }

  document.addEventListener('click', function(e) {
    const form = document.getElementById('add-form');
    const btn = document.getElementById('add-btn');
    if (form.style.display === 'flex' && !form.contains(e.target) && e.target !== btn) {
      closeForm();
    }
  });

  document.getElementById('clear-btn').onclick = function() {
    if (confirm('本当に全てのカードを削除しますか？')) {
      localStorage.removeItem(getStorageKey());
      loadCards();
    }
  };

  // 最後にロード
  loadCards();
});