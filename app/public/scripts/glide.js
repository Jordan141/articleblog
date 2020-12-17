setTimeout(() => {
    // Glide init, this should be in PROD
    const carousels = document.querySelectorAll('.glide');

    Object.values(carousels).forEach((carousel, index) => {
      new Glide(carousel, {
        type: 'carousel',
        startAt: 0,
        perView: 3,
        breakpoints: {
          1023: {
            perView: 1
          },
          800: {
            perView: 1
          }
        }
      }).mount()
    });
  }, 1000)