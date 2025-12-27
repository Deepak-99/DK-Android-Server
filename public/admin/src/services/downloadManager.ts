type QueueItem = {
    id: string;
    path: string;
    filename: string;
    start: () => Promise<void>;
};

class DownloadManager {
    private queue: QueueItem[] = [];
    private active = false;
    listeners = new Set<(q: QueueItem[]) => void>();

    enqueue(item: QueueItem) {
        this.queue.push(item);
        this.emit();
        this.process();
    }

    subscribe(cb: any) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    emit() {
        for (const cb of this.listeners) cb([...this.queue]);
    }

    async process() {
        if (this.active || this.queue.length === 0) return;
        this.active = true;

        const item = this.queue[0];
        await item.start();

        this.queue.shift();
        this.emit();

        this.active = false;
        this.process();
    }
}

export const downloadManager = new DownloadManager();
