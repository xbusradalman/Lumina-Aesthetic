$(document).ready(function () {
  /**
   * Animates a count-up effect on the given element.
   * @param {jQuery} $el - The jQuery element to animate.
   * @param {number} [duration=2000] - Duration of the animation in milliseconds.
   */
  function countUp($el, duration = 2000) {
    const target = parseFloat($el.data('count')) || 0;
    const suffix = $el.data('suffix') || '';
    const isInteger = Number.isInteger(target);

    $({ countNum: 0 }).animate({ countNum: target }, {
      duration: duration,
      easing: 'swing',
      step: function () {
        const formatted = isInteger ? Math.floor(this.countNum) : this.countNum.toFixed(1);
        $el.text(formatted + suffix);
      },
      complete: function () {
        const formatted = isInteger ? Math.floor(target) : target.toFixed(1);
        $el.text(formatted + suffix);
      }
    });
  }

  // Setup IntersectionObserver
  function setupCountUpObserver(selector = '.count-up') {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const $target = $(entry.target);
          if (!$target.hasClass('counted')) {
            countUp($target);
            $target.addClass('counted');
          }
          obs.unobserve(entry.target); // Stop observing after triggered
        }
      });
    }, { threshold: 0.6 });

    $(selector).each(function () {
      observer.observe(this);
    });
  }

  // Activate count-up observers
  setupCountUpObserver();
});