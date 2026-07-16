document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  initWhyAIPipeline();
});

/* --- Hero Particle Simulation Canvas --- */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.offsetWidth);
  let height = (canvas.height = canvas.offsetHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  });

  const particles = [];
  const particleCount = 60;
  
  // A vertical "filter zone" in the middle of the screen
  const filterX = width * 0.45;

  class Particle {
    constructor() {
      this.reset();
      this.x = Math.random() * width; // Initial random spread
    }

    reset() {
      this.x = 0;
      this.y = Math.random() * height;
      this.size = Math.random() * 3 + 1.5;
      this.speedX = Math.random() * 1.5 + 0.8;
      this.speedY = (Math.random() - 0.5) * 0.5;
      
      // Before filterX: Polluted state (dark gray/yellow)
      // After filterX: Clean state (emerald/blue/mint)
      this.isClean = false;
      this.color = 'rgba(148, 163, 184, 0.4)'; // Slate/Gray-ish
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Wrap-around y direction
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;

      // Filter crossing logic
      if (!this.isClean && this.x >= filterX) {
        this.isClean = true;
        // Turn into fresh emerald or blue light
        const rand = Math.random();
        if (rand < 0.5) {
          this.color = 'rgba(16, 185, 129, 0.6)'; // Mint Green
        } else {
          this.color = 'rgba(37, 99, 235, 0.6)'; // Soft Blue
        }
        // Accelerate clean air particles slightly
        this.speedX *= 1.25;
      }

      // Reset when particle goes off screen
      if (this.x > width) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();

      // Add a subtle glow for clean particles
      if (this.isClean) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.color;
      } else {
        ctx.shadowBlur = 0;
      }
    }
  }

  // Populate particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // Draw subtle vertical filter line representation
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.06)';
    ctx.lineWidth = 2;
    ctx.moveTo(filterX, 0);
    ctx.lineTo(filterX, height);
    ctx.stroke();

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  animate();
}

/* --- Why AI Section Pipeline Animation --- */
function initWhyAIPipeline() {
  const manualNodes = document.querySelectorAll('.pipeline-comparison.manual .pipeline-node');
  const aiNodes = document.querySelectorAll('.pipeline-comparison.ai .pipeline-node');
  
  const manualTimerElement = document.getElementById('manual-timer');
  const aiTimerElement = document.getElementById('ai-timer');

  let manualIndex = 0;
  let aiIndex = 0;

  // Animate Manual Process nodes slowly (takes minutes/hours)
  function animateManual() {
    manualNodes.forEach(node => node.classList.remove('active'));
    
    if (manualNodes[manualIndex]) {
      manualNodes[manualIndex].classList.add('active');
      
      // Update simulated hours/minutes counter
      const elapsedHours = (manualIndex + 1) * 1.5;
      if (manualTimerElement) {
        manualTimerElement.textContent = `${elapsedHours.toFixed(1)} Hours`;
      }
      
      manualIndex = (manualIndex + 1) % manualNodes.length;
    }
  }

  // Animate AI Process nodes instantly (takes seconds)
  function animateAI() {
    aiNodes.forEach(node => node.classList.remove('active'));
    
    if (aiNodes[aiIndex]) {
      aiNodes[aiIndex].classList.add('active');
      
      // Update simulated seconds counter
      const elapsedSeconds = (aiIndex + 1) * 0.4;
      if (aiTimerElement) {
        aiTimerElement.textContent = `${elapsedSeconds.toFixed(1)} Seconds`;
      }
      
      aiIndex = (aiIndex + 1) % aiNodes.length;
    }
  }

  // Initial runs
  animateManual();
  animateAI();

  // Manual loop: every 2.5 seconds representing long hours
  setInterval(animateManual, 2500);

  // AI loop: fast iteration every 500ms representing rapid execution
  setInterval(animateAI, 500);
}
