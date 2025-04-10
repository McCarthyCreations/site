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
        
        // Create pulse element
        this.pulse = document.createElement('div');
        this.pulse.className = 'pulse';
        this.pulse.style.background = this.color;
        this.element.appendChild(this.pulse);
        
        container.appendChild(this.element);
    }

    updatePosition() {
        // Fix: Proper screen wrapping
        if (this.x < -this.size) this.x = window.innerWidth + this.size/2;
        if (this.x > window.innerWidth + this.size) this.x = -this.size/2;
        if (this.y < -this.size) this.y = window.innerHeight + this.size/2;
        if (this.y > window.innerHeight + this.size) this.y = -this.size/2;

        // Apply squish effect
        const squishAmount = 0.2 * this.squishFactor;
        const scaleX = 1 + squishAmount;
        const scaleY = 1 - squishAmount;
        
        this.element.style.transform = `translate(${this.x}px, ${this.y}px) scale(${scaleX}, ${scaleY})`;
        this.squishFactor *= 0.9; // Gradually reduce squish
    }

    triggerPulse() {
        // Fix: Proper pulse animation
        this.pulse.style.animation = 'none';
        this.pulse.offsetHeight; // Trigger reflow
        this.pulse.style.animation = 'pulse-animation 0.6s ease-out forwards';
    }

    update(blobs) {
        // Check for collisions
        this.checkCollisions(blobs);
        
        // Update position with velocity
        this.x += this.vx;
        this.y += this.vy;

        // Apply very slight damping
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
        const repelStrength = 0.5;
        
        blobs.forEach(other => {
            if (other === this) return;
            
            // Calculate distance with proper wrapping
            let dx = other.x - this.x;
            let dy = other.y - this.y;
            
            // Fix: More accurate wrapping distance calculation
            if (Math.abs(dx) > window.innerWidth / 2) {
                dx = dx > 0 ? dx - window.innerWidth : dx + window.innerWidth;
            }
            if (Math.abs(dy) > window.innerHeight / 2) {
                dy = dy > 0 ? dy - window.innerHeight : dy + window.innerHeight;
            }
            
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (this.size/2) + (other.size/2);
            
            if (distance < minDistance) {
                const angle = Math.atan2(dy, dx);
                const force = repelStrength * (minDistance - distance) / minDistance;
                
                this.vx -= Math.cos(angle) * force;
                this.vy -= Math.sin(angle) * force;
                other.vx += Math.cos(angle) * force;
                other.vy += Math.sin(angle) * force;
                
                const collisionStrength = Math.min(1, (minDistance - distance) / 10);
                this.squishFactor = Math.max(this.squishFactor, collisionStrength);
                other.squishFactor = Math.max(other.squishFactor, collisionStrength);
            }
        });
    }

    applyForce(forceX, forceY) {
        this.vx += forceX * 1.5;
        this.vy += forceY * 1.5;
        this.squishFactor = 1;
        this.triggerPulse(); // Fix: Ensure pulse triggers on force
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
        
        this.init();
    }
    
    init() {
        // Create blobs
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
        this.blobs.forEach(blob => blob.update(this.blobs));
        requestAnimationFrame(this.animate.bind(this));
    }
    
    setupLogoEffects() {
        const logo = document.getElementById('logo');
        const sparkle1 = document.createElement('div');
        sparkle1.className = 'sparkle';
        logo.appendChild(sparkle1);
        
        const sparkle2 = document.createElement('div');
        sparkle2.className = 'sparkle';
        logo.appendChild(sparkle2);
        
        logo.addEventListener('mouseenter', () => {
            const randomColor = this.colorOptions[Math.floor(Math.random() * this.colorOptions.length)];
            sparkle1.style.background = `radial-gradient(circle, ${randomColor} 0%, transparent 70%)`;
            sparkle2.style.background = `radial-gradient(circle, white 0%, transparent 70%)`;
            this.triggerShake(true);
        });
        
        logo.addEventListener('touchstart', () => {
            const randomColor = this.colorOptions[Math.floor(Math.random() * this.colorOptions.length)];
            sparkle1.style.background = `radial-gradient(circle, ${randomColor} 0%, transparent 70%)`;
            sparkle2.style.background = `radial-gradient(circle, white 0%, transparent 70%)`;
            this.triggerShake(true);
        }, { passive: true });
    }
    
    triggerShake(strongForce = false) {
        this.blobs.forEach(blob => {
            const forceMultiplier = strongForce ? 6 : 3;
            blob.applyForce(
                (Math.random() - 0.5) * forceMultiplier,
                (Math.random() - 0.5) * forceMultiplier
            );
        });
        
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
            window.addEventListener('devicemotion', (e) => {
                if (Date.now() - lastShakeTime < 1000) return;
                const acc = e.accelerationIncludingGravity;
                if (acc && (Math.abs(acc.x) > 15 || Math.abs(acc.y) > 15 || Math.abs(acc.z) > 15)) {
                    this.triggerShake();
                    lastShakeTime = Date.now();
                }
            });
        }
    }
    
    handleResize() {
        this.blobs.forEach(blob => {
            blob.x = Math.max(-blob.size, Math.min(window.innerWidth + blob.size, blob.x));
            blob.y = Math.max(-blob.size, Math.min(window.innerHeight + blob.size, blob.y));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BlobAnimator();
});