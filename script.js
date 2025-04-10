class Blob {
    constructor(container, color) {
        this.container = container;
        this.element = document.createElement('div');
        this.element.className = 'blob';
        
        // Initialize properties
        this.size = Math.random() * 150 + 100;
        this.baseSize = this.size;
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.mass = this.size / 50;
        this.color = color;
        this.squishFactor = 0;
        
        // Visual setup
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.background = this.color;
        this.element.style.borderRadius = '50%';
        this.updatePosition();
        
        container.appendChild(this.element);
    }

    updatePosition() {
        // Asteroids-style wrapping
        if (this.x < -this.size) this.x = window.innerWidth + this.size;
        if (this.x > window.innerWidth + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = window.innerHeight + this.size;
        if (this.y > window.innerHeight + this.size) this.y = -this.size;

        // Apply squish effect
        const squishAmount = 0.2 * this.squishFactor;
        const scaleX = 1 + squishAmount;
        const scaleY = 1 - squishAmount;
        
        this.element.style.transform = `translate(${this.x}px, ${this.y}px) scale(${scaleX}, ${scaleY})`;
        this.squishFactor *= 0.9; // Gradually reduce squish
    }

    update(blobs) {
        // Only check for collisions (no gravity/attraction)
        this.checkCollisions(blobs);
        
        // Update position with velocity
        this.x += this.vx;
        this.y += this.vy;

        // Apply very slight damping (0.2% per frame)
        this.vx *= 0.998;
        this.vy *= 0.998;

        // Enforce maximum velocity
        const maxSpeed = 8;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }

        this.updatePosition();
    }

    checkCollisions(blobs) {
        const repelStrength = 0.5; // Strength of repulsion when colliding
        
        blobs.forEach(other => {
            if (other === this) return;
            
            // Calculate distance with wrapping
            let dx = other.x - this.x;
            let dy = other.y - this.y;
            
            // Find shortest distance (accounting for wrap)
            if (Math.abs(dx) > window.innerWidth / 2) {
                dx = dx > 0 ? dx - window.innerWidth : dx + window.innerWidth;
            }
            if (Math.abs(dy) > window.innerHeight / 2) {
                dy = dy > 0 ? dy - window.innerHeight : dy + window.innerHeight;
            }
            
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (this.size/2) + (other.size/2);
            
            if (distance < minDistance) {
                // Collision - strong repulsion
                const angle = Math.atan2(dy, dx);
                const force = repelStrength * (minDistance - distance) / minDistance;
                
                this.vx -= Math.cos(angle) * force;
                this.vy -= Math.sin(angle) * force;
                other.vx += Math.cos(angle) * force;
                other.vy += Math.sin(angle) * force;
                
                // Squish effect
                const collisionStrength = Math.min(1, (minDistance - distance) / 10);
                this.squishFactor = Math.max(this.squishFactor, collisionStrength);
                other.squishFactor = Math.max(other.squishFactor, collisionStrength);
            }
        });
    }

    applyForce(forceX, forceY) {
        // Apply force with mass consideration
        this.vx += forceX * 1.5;
        this.vy += forceY * 1.5;
        this.squishFactor = 1; // Visual feedback
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
        this.animate();
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    animate() {
        // Update all blobs with collision physics only
        this.blobs.forEach(blob => blob.update(this.blobs));
        
        requestAnimationFrame(this.animate.bind(this));
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
            const forceMultiplier = strongForce ? 6 : 3;
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
            blob.x = Math.max(-blob.size, Math.min(window.innerWidth + blob.size, blob.x));
            blob.y = Math.max(-blob.size, Math.min(window.innerHeight + blob.size, blob.y));
            blob.updatePosition();
        });
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    new BlobAnimator();
});