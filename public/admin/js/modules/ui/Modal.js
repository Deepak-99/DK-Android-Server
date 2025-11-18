// public/admin/js/modules/ui/Modal.js
export class Modal {
    constructor(options = {}) {
        this.id = options.id || 'modal-' + Math.random().toString(36).substr(2, 9);
        this.title = options.title || '';
        this.content = options.content || '';
        this.buttons = options.buttons || [];
        this.onClose = options.onClose || (() => {});
        this.modalElement = null;
    }

    show() {
        if (this.modalElement) {
            this.modalElement.remove();
        }

        this.modalElement = document.createElement('div');
        this.modalElement.className = 'modal fade';
        this.modalElement.id = this.id;
        this.modalElement.tabIndex = -1;
        this.modalElement.setAttribute('role', 'dialog');
        this.modalElement.setAttribute('aria-hidden', 'true');

        const modalDialog = document.createElement('div');
        modalDialog.className = 'modal-dialog';
        modalDialog.setAttribute('role', 'document');

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        // Modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';

        const modalTitle = document.createElement('h5');
        modalTitle.className = 'modal-title';
        modalTitle.textContent = this.title;

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.setAttribute('data-bs-dismiss', 'modal');
        closeButton.setAttribute('aria-label', 'Close');

        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);

        // Modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        if (typeof this.content === 'string') {
            modalBody.innerHTML = this.content;
        } else {
            modalBody.appendChild(this.content);
        }

        // Modal footer
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';

        this.buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `btn ${button.className || 'btn-secondary'}`;
            btn.textContent = button.text;
            if (button.onClick) {
                btn.addEventListener('click', () => {
                    button.onClick(this);
                });
            } else {
                btn.setAttribute('data-bs-dismiss', 'modal');
            }
            modalFooter.appendChild(btn);
        });

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modalDialog.appendChild(modalContent);
        this.modalElement.appendChild(modalDialog);

        document.body.appendChild(this.modalElement);

        const modal = new bootstrap.Modal(this.modalElement);
        modal.show();

        this.modalElement.addEventListener('hidden.bs.modal', () => {
            this.onClose();
            this.modalElement.remove();
            this.modalElement = null;
        });
    }

    hide() {
        if (this.modalElement) {
            const modal = bootstrap.Modal.getInstance(this.modalElement);
            if (modal) {
                modal.hide();
            }
        }
    }
}