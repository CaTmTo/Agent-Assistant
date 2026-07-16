document.addEventListener('DOMContentLoaded', function() {
  function initParticleBackground() {
    var canvas = document.createElement('canvas');
    canvas.id = 'particle-bg';
    canvas.style.cssText = '\n      position: fixed;\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      z-index: -2;\n      pointer-events: none;\n      background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.34), transparent 34%), linear-gradient(135deg, #d5e8fb 0%, #d9e6f7 46%, #e7ecf8 100%);\n    ';
    document.body.insertBefore(canvas, document.body.firstChild);

    var ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.style.background = 'radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.34), transparent 34%), linear-gradient(135deg, #d5e8fb 0%, #d9e6f7 46%, #e7ecf8 100%)';
      return;
    }

    var particles = [];
    var particleCount = 110;
    var connectionDistance = 165;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      for (var i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2.4 + 1.2,
          opacity: Math.random() * 0.45 + 0.45
        });
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(function(p) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        var dotColor = p.radius > 2.6 ? '126, 58, 242' : '42, 101, 219';
        ctx.fillStyle = 'rgba(' + dotColor + ', ' + p.opacity + ')';
        ctx.fill();
      });

      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            var opacity = (1 - distance / connectionDistance) * 0.34;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(76, 111, 184, ' + opacity + ')';
            ctx.lineWidth = 1.15;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', function() {
      resize();
      createParticles();
    });
  }

  initParticleBackground();
});
