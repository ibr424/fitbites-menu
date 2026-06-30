// ── NAV ──
function go(id, btn) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  var sec = document.getElementById(id);
  if (!sec) return;
  var navH = (document.querySelector('.nav-outer') || {offsetHeight:56}).offsetHeight;
  var top = sec.getBoundingClientRect().top + window.pageYOffset - navH - 6;
  window.scrollTo({ top: top, behavior: 'smooth' });
}

// ── SCROLL SPY ──
(function() {
  function initSpy() {
    var sections = document.querySelectorAll('.sec');
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          document.querySelectorAll('.nav-btn').forEach(function(b) {
            var m = /go\('(\w+)'/.exec(b.getAttribute('onclick') || '');
            b.classList.toggle('on', !!(m && m[1] === id));
          });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sections.forEach(function(s) { observer.observe(s); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpy);
  } else {
    initSpy();
  }
})();

// ── LANGUAGE ──
function setLang(lang) {
  var ar = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = ar ? 'rtl' : 'ltr';
  document.body.classList.toggle('ar', ar);
  document.getElementById('btn-en').classList.toggle('on', !ar);
  document.getElementById('btn-ar').classList.toggle('on', ar);
  document.querySelectorAll('[data-en]').forEach(function(el) {
    var val = el.getAttribute(ar ? 'data-ar' : 'data-en');
    if (!val) return;
    if (el.tagName === 'BUTTON' || el.classList.contains('nav-btn')) el.textContent = val;
    else el.innerHTML = val;
  });
  document.querySelectorAll('.cname').forEach(function(el) {
    var val = el.getAttribute(ar ? 'data-ar' : 'data-en');
    if (val) el.textContent = val;
  });
  updateTypeUI();
  renderCart();
}

// ── ORDER NUMBERS ──
function todayKey() { return new Date().toISOString().slice(0,10); }
function peekNum() {
  var s = JSON.parse(localStorage.getItem('fb_o') || '{"d":"","n":0}');
  return String((s.d === todayKey() ? s.n : 0) + 1).padStart(3,'0');
}
function nextNum() {
  var s = JSON.parse(localStorage.getItem('fb_o') || '{"d":"","n":0}');
  if (s.d !== todayKey()) { s.d = todayKey(); s.n = 0; }
  s.n++;
  localStorage.setItem('fb_o', JSON.stringify(s));
  return String(s.n).padStart(3,'0');
}

// ── ORDER TYPE ──
var orderType = 'dine';
function setType(t, btn) {
  orderType = t;
  document.querySelectorAll('.ot-btn').forEach(function(b){b.classList.remove('on');});
  btn.classList.add('on');
  updateTypeUI();
}
function updateTypeUI() {
  var ar = document.body.classList.contains('ar');
  var lbl = document.getElementById('typeLabel');
  var inp = document.getElementById('typeInput');
  if (!lbl || !inp) return;
  if (orderType === 'pickup') {
    lbl.style.display = 'none';
    inp.style.display = 'none';
  } else {
    lbl.style.display = '';
    inp.style.display = '';
    if (orderType === 'dine') {
      lbl.textContent = ar ? 'رقم الطاولة' : 'Table Number';
      inp.placeholder = ar ? 'مثال: طاولة 5' : 'e.g. Table 5';
    } else {
      lbl.textContent = ar ? 'عنوان التوصيل' : 'Delivery Address';
      inp.placeholder = ar ? 'اكتب عنوانك كاملاً' : 'Enter your full address';
    }
  }
}

// ── CART ──
var WA = '971509605007';
var cart = {};

// ── ITEM MODAL ──
var _mBtn = null, _mQty = 1;

function addItem(btn) {
  var ar = document.body.classList.contains('ar');
  var card = btn.closest('.card');
  var cname = card.querySelector('.cname');
  var name   = cname.getAttribute('data-en') || cname.textContent.trim();
  var arName = cname.getAttribute('data-ar') || name;
  var price  = parseInt(card.dataset.price) || 0;
  var img    = card.querySelector('img') ? card.querySelector('img').src : '';
  var desc   = card.querySelector('.cdesc') ? card.querySelector('.cdesc').textContent.trim() : '';
  var badge  = card.querySelector('.badge');
  _mBtn = btn; _mQty = 1;
  var imgEl = document.getElementById('imImg');
  imgEl.innerHTML = (img
    ? '<img src="'+img+'">'
    : '<div class="im-img-emoji">🥗</div>') +
    '<button class="im-close" onclick="closeItemModal()">✕</button>';
  document.getElementById('imBadgeRow').innerHTML = badge ? badge.outerHTML : '';
  document.getElementById('imName').textContent = ar ? arName : name;
  document.getElementById('imDesc').textContent = desc;
  document.getElementById('imPrice').textContent = price + ' AED';
  document.getElementById('imQty').textContent = 1;
  document.getElementById('imQtyLbl').textContent = ar ? 'الكمية' : 'Quantity';
  _updateImBtn(price);
  document.getElementById('itemModal').classList.add('open');
}
function closeItemModal() {
  document.getElementById('itemModal').classList.remove('open');
  _mBtn = null;
}
function chgMQty(d) {
  _mQty = Math.max(1, _mQty + d);
  document.getElementById('imQty').textContent = _mQty;
  if (_mBtn) {
    var price = parseInt(_mBtn.closest('.card').dataset.price) || 0;
    _updateImBtn(price);
  }
}
function _updateImBtn(price) {
  var ar = document.body.classList.contains('ar');
  document.getElementById('imAddBtn').textContent =
    (ar ? 'أضف للسلة — ' : 'Add to Cart — ') + (_mQty * price) + ' AED';
}
function addFromModal() {
  if (!_mBtn) return;
  var ar = document.body.classList.contains('ar');
  var card = _mBtn.closest('.card');
  var cname = card.querySelector('.cname');
  var name   = cname.getAttribute('data-en') || cname.textContent.trim();
  var arName = cname.getAttribute('data-ar') || name;
  var price  = parseInt(card.dataset.price) || 0;
  var img    = card.querySelector('img') ? card.querySelector('img').src : '';
  var id     = 'i_' + name.replace(/\s+/g,'_');
  if (cart[id]) cart[id].qty += _mQty;
  else cart[id] = {name:name, arName:arName, price:price, qty:_mQty, img:img};
  updateFab();
  closeItemModal();
  _mBtn = null;
}

function updateFab() {
  var total = Object.values(cart).reduce(function(s,i){return s+i.qty;},0);
  var fab = document.getElementById('cartFab');
  document.getElementById('cartBadge').textContent = total;
  if (total > 0) fab.classList.add('show'); else fab.classList.remove('show');
  var numEl = document.getElementById('orderNumVal');
  if (numEl) numEl.textContent = '#' + peekNum();
}

function renderCart() {
  var ar = document.body.classList.contains('ar');
  var keys = Object.keys(cart);
  var body = document.getElementById('cartBody');
  var bottom = document.getElementById('cartBottom');
  var totalEl = document.getElementById('cartTotal');

  if (keys.length === 0) {
    body.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛒</div><div>' + (ar?'سلتك فارغة — أضف شيئاً!':'Your cart is empty — add something!') + '</div></div>';
    bottom.style.display = 'none';
    return;
  }

  bottom.style.display = 'block';
  var total = keys.reduce(function(s,k){return s+cart[k].qty*cart[k].price;},0);
  totalEl.textContent = total + ' AED';
  document.getElementById('orderNumVal').textContent = '#' + peekNum();

  body.innerHTML = '<div class="cart-items">' + keys.map(function(id) {
    var it = cart[id];
    var displayName = ar ? (it.arName || it.name) : it.name;
    return '<div class="cart-item">' +
      '<img class="ci-img" src="' + it.img + '">' +
      '<div class="ci-info"><div class="ci-name">' + it.name + '</div><div class="ci-price">' + (it.price*it.qty) + ' AED</div></div>' +
      '<div class="ci-controls">' +
        '<button class="ci-btn" onclick="changeQty(\'' + id + '\',-1)">&#8722;</button>' +
        '<span class="ci-qty">' + it.qty + '</span>' +
        '<button class="ci-btn" onclick="changeQty(\'' + id + '\',1)">+</button>' +
      '</div></div>';
  }).join('') + '</div>';
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  updateFab();
  renderCart();
}

function openCart() {
  document.getElementById('cartOverlay').classList.add('open');
  renderCart();
  updateTypeUI();
}
function closeCart() { document.getElementById('cartOverlay').classList.remove('open'); }
function closeOutside(e) { if (e.target === document.getElementById('cartOverlay')) closeCart(); }

function sendOrder() {
  var keys = Object.keys(cart);
  if (!keys.length) return;
  var ar = document.body.classList.contains('ar');

  var nameInp = document.getElementById('clientName');
  var clientName = nameInp.value.trim();
  var nameErr = document.getElementById('nameError');
  if (!clientName) {
    nameInp.classList.add('error-state','shake');
    nameErr.classList.add('show');
    nameErr.textContent = ar ? 'يرجى إدخال اسمك للمتابعة' : 'Please enter your name to continue';
    nameInp.focus();
    setTimeout(function(){ nameInp.classList.remove('shake'); }, 400);
    return;
  }
  nameInp.classList.remove('error-state');
  nameErr.classList.remove('show');

  var num = nextNum();
  var typeVal = document.getElementById('typeInput').value.trim();
  var notes = document.getElementById('cartNotes').value.trim();
  var total = keys.reduce(function(s,k){return s+cart[k].qty*cart[k].price;},0);
  var typeLabels = {dine: ar?'داخل المطعم':'Dine In', pickup: ar?'استلام':'Pickup', delivery: ar?'توصيل':'Delivery'};
  var inputLabels = {dine: ar?'الطاولة':'Table', pickup: ar?'الاسم':'Name', delivery: ar?'العنوان':'Address'};

  var msg = ar
    ? '*طلب جديد — FitBites*\n*رقم الطلب: #' + num + '*\n' + (ar?'الاسم: ':'Name: ') + clientName + '\n' + typeLabels[orderType]
    : '*New Order — FitBites*\n*Order #' + num + '*\nName: ' + clientName + '\n' + typeLabels[orderType];

  if (typeVal) msg += '\n' + inputLabels[orderType] + ': ' + typeVal;
  msg += '\n\n';
  keys.forEach(function(id){
    var it = cart[id];
    msg += '• ' + it.name + ' x' + it.qty + ' — ' + (it.price*it.qty) + ' AED\n';
  });
  msg += ar ? '\n*الإجمالي: ' + total + ' AED*' : '\n*Total: ' + total + ' AED*';
  if (notes) msg += (ar?'\n*ملاحظات:* ':'\n*Notes:* ') + notes;

  window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank');

  closeCart();
  document.getElementById('sTitle').textContent = ar ? 'تم إرسال طلبك! 🎉' : 'Order Sent! 🎉';
  document.getElementById('sSub').textContent = ar ? 'رقم طلبك اليوم هو' : "Today's order number";
  document.getElementById('sNum').textContent = '#' + num;
  document.getElementById('sDetail').textContent = typeLabels[orderType] + (typeVal?' · '+inputLabels[orderType]+': '+typeVal:'') + ' · ' + total + ' AED';
  document.getElementById('sClose').textContent = ar ? 'تم ✓' : 'Done ✓';
  document.getElementById('successOverlay').classList.add('show');

  cart = {};
  document.getElementById('cartNotes').value = '';
  document.getElementById('typeInput').value = '';
  document.getElementById('clientName').value = '';
  updateFab();
}

function closeSuccess() { document.getElementById('successOverlay').classList.remove('show'); }

