import { clipboard } from "electron";
import { EventEmitter } from 'events';
import { exec } from 'child_process';

export class ClipboardListener extends EventEmitter {
    private previousClipboard = "";
    private lastCommand = "";
    private lastCommandTime = 0;
    
    private isListening: boolean;
    private interval: NodeJS.Timeout | undefined;

    constructor() {
        super();
        let clipboardText = clipboard.readText();
        if (clipboardText.startsWith('VOTC:')) {
            clipboard.writeText('');
            this.previousClipboard = '';
        } else {
            this.previousClipboard = clipboardText;
        }

        this.isListening = false;
    }

    start() {
        if (this.isListening) {
            throw new Error('ClipboardListener is already listening!');
        }
        this.interval = setInterval(this.readClipboard.bind(this), 100);
        this.isListening = true;
    }

    stop() {
        if (!this.isListening) {
            throw new Error('ClipboardListener is not currently listening!');
        }

        clearInterval(this.interval);
        this.isListening = false;
    }

    readClipboard() {
        let currentClipboard = clipboard.readText();
        if (this.previousClipboard === currentClipboard) return;

        if (currentClipboard.startsWith('VOTC:')) {
            if (currentClipboard === this.lastCommand && (Date.now() - this.lastCommandTime < 2000)) {
                return;
            }
            
            this.lastCommand = currentClipboard;
            this.lastCommandTime = Date.now();

            let command = currentClipboard.split(':')[1];
            switch (command) {
                case "IN": this.emit('VOTC:IN'); break;
                case "EFFECT_ACCEPTED": this.emit('VOTC:EFFECT_ACCEPTED'); break;
                case "LETTER": this.emit('VOTC:LETTER'); break;
                case "LETTER_ACCEPTED": this.emit('VOTC:LETTER_ACCEPTED'); break;
            }

            if (process.platform === 'linux') {
                const isWayland = process.env.XDG_SESSION_TYPE === 'wayland' || !!process.env.WAYLAND_DISPLAY;
                const safeText = this.previousClipboard.replace(/'/g, "'\\''");
                
                if (isWayland) {
                    exec(`echo '${safeText}' | wl-copy`, (err) => { 
                        if(err) console.error('Wayland clipboard restore failed:', err); 
                    });
                } else {
                    exec(`echo '${safeText}' | xclip -selection clipboard`, (err) => { 
                        if(err) console.error('X11 clipboard restore failed:', err); 
                    });
                }
            } else {
                clipboard.writeText(this.previousClipboard);
            }
            
        } else {
            this.previousClipboard = currentClipboard;
        }
    }
}