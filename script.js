class Blob {
    constructor(container, color) {
        this.container = container;
        this.element = document.createElement('div');
        this.element.className = 'blob';
        
        this.size = Math.random() * 150 + 100;
        this.x = Math.random() * (window.innerWidth - this.size);
        this.y = Math.random() * (window.innerHeight - this.size);
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.mass = this.size / 50;
        this.color = color;
        
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.background = this.color;
        this.updatePosition();
        
        container.appendChild(this.element);
    }

    updatePosition() {
        this.element.style.transform = `translate(${this.x}px, ${this.y}px)`;
    }

    update() {
        // Minimal damping to prevent complete stop
        this.vx *= 0.999;
        this.vy *= 0.999;
        
        this.x += this.vx;
        this.y += this.vy;

        // Boundary collision with minimal energy loss
        if (this.x <= 0 || this.x >= window.innerWidth - this.size) {
            this.vx *= -0.95;
            this.x = Math.max(0, Math.min(window.innerWidth - this.size, this.x));
        }
        if (this.y <= 0 || this.y >= window.innerHeight - this.size) {
            this.vy *= -0.95;
            this.y = Math.max(0, Math.min(window.innerHeight - this.size, this.y));
        }

        this.updatePosition();
    }

    applyForce(forceX, forceY) {
        // Strong force application
        this.vx += forceX * 3;
        this.vy += forceY * 3;
    }
}

class BlobAnimator {
    constructor() {
        this.container = document.getElementById('blobs-container');
        this.blobs = [];
        this.colorOptions = [
            'rgba(168, 230, 207, 0.9)',  // green
            'rgba(212, 165, 230, 0.9)',  // purple
            'rgba(165, 199, 230, 0.9)',  // blue
            'rgba(255, 170, 165, 0.9)',  // red
            'rgba(255, 211, 182, 0.9)'   // yellow
        ];
        this.sparkles = [];
        
        this.init();
    }
    
    init() {
        // Create blobs - one of each color
        this.colorOptions.forEach(color => {
            this.blobs.push(new Blob(this.container, color));
        });
        
        // Set up interactions
        this.setupLogoEffects();
        this.setupShakeButton();
        this.setupDeviceMotion();
        
        // Start animation loop
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        // Handle resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    animate() {
        // Update physics
        this.blobs.forEach(blob => blob.update());
        
        // Check collisions between all blob pairs
        for (let i = 0; i < this.blobs.length; i++) {
            for (let j = i + 1; j < this.blobs.length; j++) {
                this.checkCollision(this.blobs[i], this.blobs[j]);
            }
        }
        
        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
    
    checkCollision(blob1, blob2) {
        const dx = (blob1.x + blob1.size/2) - (blob2.x + blob2.size/2);
        const dy = (blob1.y + blob1.size/2) - (blob2.y + blob2.size/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = (blob1.size/2) + (blob2.size/2);
        
        if (distance < minDist) {
            const angle = Math.atan2(dy, dx);
            const totalMass = blob1.mass + blob2.mass;
            const force = 0.05 * (minDist - distance);
            
            // Apply repulsion force
            blob1.vx += Math.cos(angle) * force * (blob2.mass/totalMass);
            blob1.vy += Math.sin(angle) * force * (blob2.mass/totalMass);
            blob2.vx -= Math.cos(angle) * force * (blob1.mass/totalMass);
            blob2.vy -= Math.sin(angle) * force * (blob1.mass/totalMass);
        }
    }
    
    setupLogoEffects() {
        const logo = document.getElementById('logo');
        
        // Create sparkle elements
        const sparkle1 = document.createElement('div');
        sparkle1.className = 'sparkle';
        logo.appendChild(sparkle1);
        
        const sparkle2 = document.createElement('div');
        sparkle2.className = 'sparkle';
        logo.appendChild(sparkle2);
        
        this.sparkles = [sparkle1, sparkle2];
        
        // Hover effects
        logo.addEventListener('mouseenter', () => this.handleLogoInteraction());
        logo.addEventListener('touchstart', () => this.handleLogoInteraction(), { passive: true });
    }
    
    handleLogoInteraction() {
        // Random color from blob colors
        const randomColor = this.colorOptions[Math.floor(Math.random() * this.colorOptions.length)];
        this.sparkles[0].style.background = `radial-gradient(circle, ${randomColor} 0%, transparent 70%)`;
        this.sparkles[1].style.background = `radial-gradient(circle, white 0%, transparent 70%)`;
        
        // Trigger strong shake
        this.triggerShake(true);
    }
    
    triggerShake(strongForce = false) {
        // Apply forces to blobs
        this.blobs.forEach(blob => {
            const forceMultiplier = strongForce ? 5 : 3;
            const forceX = (Math.random() - 0.5) * forceMultiplier;
            const forceY = (Math.random() - 0.5) * forceMultiplier;
            blob.applyForce(forceX, forceY);
        });
        
        // Visual shake effect
        const content = document.querySelector('.content');
        content.classList.add('shake-effect');
        setTimeout(() => content.classList.remove('shake-effect'), 500);
    }
    
    setupShakeButton() {
        const shakeBtn = document.getElementById('shake-btn');
        if (shakeBtn) {
            shakeBtn.addEventListener('click', () => this.triggerShake());
        }
    }
    
    setupDeviceMotion() {
        if (window.DeviceMotionEvent) {
            let lastShakeTime = 0;
            const threshold = 15;
            
            window.addEventListener('devicemotion', (e) => {
                const currentTime = Date.now();
                if (currentTime - lastShakeTime < 1000) return;
                
                const acceleration = e.accelerationIncludingGravity;
                if (!acceleration) return;
                
                if (Math.abs(acceleration.x) > threshold || 
                    Math.abs(acceleration.y) > threshold || 
                    Math.abs(acceleration.z) > threshold) {
                    this.triggerShake();
                    lastShakeTime = currentTime;
                }
            });
        }
    }
    
    handleResize() {
        this.blobs.forEach(blob => {
            blob.x = Math.max(0, Math.min(window.innerWidth - blob.size, blob.x));
            blob.y = Math.max(0, Math.min(window.innerHeight - blob.size, blob.y));
            blob.updatePosition();
        });
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    new BlobAnimator();
});