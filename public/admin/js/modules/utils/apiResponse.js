// public/admin/js/modules/utils/apiResponse.js
export class APIResponse {
    constructor(success, data, error = null) {
        this.success = success;
        this.data = data;
        this.error = error;
        this.timestamp = new Date();
    }

    static success(data) {
        return new APIResponse(true, data);
    }

    static error(error, data = null) {
        return new APIResponse(false, data, error);
    }

    get isSuccess() {
        return this.success;
    }

    get isError() {
        return !this.success;
    }

    get errorMessage() {
        return this.error?.message || 'An unknown error occurred';
    }
}