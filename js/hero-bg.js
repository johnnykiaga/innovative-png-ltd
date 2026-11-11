// Hero background from content: images.heroBg + images.heroBgPos
document.addEventListener('DOMContentLoaded', function () {
  try {
    var data = window.SiteData && window.SiteData.get();
    if (!data || !data.images) return;
    var hero = document.querySelector('.hero-promo');
    if (!hero) return;
    var src = data.images.heroBg;
    var pos = data.images.heroBgPos || 'center center';
    if (src) {
      hero.classList.add('has-bg');
      hero.style.backgroundImage = 'url("' + String(src).replace(/"/g, '%22') + '")';
      hero.style.backgroundPosition = pos;
      hero.style.backgroundSize = 'cover';
      hero.style.backgroundRepeat = 'no-repeat';
    }
  } catch (e) {}
});
