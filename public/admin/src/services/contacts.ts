import api from './api';

export interface PhoneNumber {
    number: string;
    type: 'mobile' | 'home' | 'work' | 'fax_work' | 'fax_home' | 'pager' | 'other' | 'callback' | 'car' | 'company_main' | 'isbn' | 'main' | 'other_fax' | 'radio' | 'telex' | 'tty_tdd' | 'work_mobile' | 'work_pager' | 'assistant' | 'mms' | 'custom';
    label?: string;
    normalizedNumber?: string;
}

export interface Email {
    address: string;
    type: 'home' | 'work' | 'mobile' | 'other' | 'custom';
    label?: string;
}

export interface Address {
    type: 'home' | 'work' | 'other' | 'custom';
    label?: string;
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    formattedAddress?: string;
    poBox?: string;
    neighborhood?: string;
}

export interface Website {
    url: string;
    type: 'homepage' | 'blog' | 'profile' | 'home' | 'work' | 'other' | 'custom';
    label?: string;
}

export interface SocialProfile {
    username: string;
    type: 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'snapchat' | 'custom';
    label?: string;
    url?: string;
}

export interface Contact {
    id: string;
    displayName: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    prefix?: string;
    suffix?: string;
    phoneticName?: string;
    nickname?: string;
    photoUri?: string;
    thumbnailUri?: string;
    phoneNumbers: PhoneNumber[];
    emails: Email[];
    addresses: Address[];
    organizations: Array<{
        company?: string;
        title?: string;
        department?: string;
        jobDescription?: string;
        symbol?: string;
        officeLocation?: string;
        phoneticName?: string;
    }>;
    websites: Website[];
    socialProfiles: SocialProfile[];
    note?: string;
    groups: string[];
    starred: boolean;
    timesContacted: number;
    lastTimeContacted?: string;
    customRingtonUri?: string;
    isUserProfile: boolean;
    inDefaultDirectory: boolean;
    inVisibleGroup: boolean;
    hasPhoneNumber: boolean;
    hasEmail: boolean;
    lookupKey?: string;
    contactLastUpdatedTimestamp: string;
}

export interface ContactFilter {
    searchQuery?: string;
    hasPhoneNumber?: boolean;
    hasEmail?: boolean;
    groupId?: string;
    starred?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'recent' | 'frequent';
    sortOrder?: 'asc' | 'desc';
}

export interface ContactGroup {
    id: string;
    title: string;
    accountName?: string;
    accountType?: string;
    groupVisible: boolean;
    count: number;
}

export const getContacts = async (
    deviceId: string,
    filter?: ContactFilter
): Promise<Contact[]> => {
    const response = await api.get(`/devices/${deviceId}/contacts`, {
        params: filter,
    });
    return response.data;
};

export const getContact = async (
    deviceId: string,
    contactId: string
): Promise<Contact> => {
    const response = await api.get(`/devices/${deviceId}/contacts/${contactId}`);
    return response.data;
};

export const createContact = async (
    deviceId: string,
    contact: Omit<Contact, 'id' | 'contactLastUpdatedTimestamp' | 'timesContacted' | 'lastTimeContacted'>
): Promise<Contact> => {
    const response = await api.post(`/devices/${deviceId}/contacts`, contact);
    return response.data;
};

export const updateContact = async (
    deviceId: string,
    contactId: string,
    updates: Partial<Omit<Contact, 'id' | 'contactLastUpdatedTimestamp' | 'timesContacted' | 'lastTimeContacted'>>
): Promise<Contact> => {
    const response = await api.patch(
        `/devices/${deviceId}/contacts/${contactId}`,
        updates
    );
    return response.data;
};

export const deleteContact = async (
    deviceId: string,
    contactId: string
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/contacts/${contactId}`);
};

export const mergeContacts = async (
    deviceId: string,
    contactIds: string[]
): Promise<Contact> => {
    const response = await api.post(`/devices/${deviceId}/contacts/merge`, {
        contactIds,
    });
    return response.data;
};

export const getContactGroups = async (
    deviceId: string
): Promise<ContactGroup[]> => {
    const response = await api.get(`/devices/${deviceId}/contacts/groups`);
    return response.data;
};

export const createContactGroup = async (
    deviceId: string,
    group: Omit<ContactGroup, 'id' | 'count'>
): Promise<ContactGroup> => {
    const response = await api.post(
        `/devices/${deviceId}/contacts/groups`,
        group
    );
    return response.data;
};

export const updateContactGroup = async (
    deviceId: string,
    groupId: string,
    updates: Partial<Omit<ContactGroup, 'id' | 'count'>>
): Promise<ContactGroup> => {
    const response = await api.patch(
        `/devices/${deviceId}/contacts/groups/${groupId}`,
        updates
    );
    return response.data;
};

export const deleteContactGroup = async (
    deviceId: string,
    groupId: string,
    deleteContacts: boolean = false
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/contacts/groups/${groupId}`, {
        params: { deleteContacts },
    });
};

export const addContactsToGroup = async (
    deviceId: string,
    groupId: string,
    contactIds: string[]
): Promise<void> => {
    await api.post(`/devices/${deviceId}/contacts/groups/${groupId}/add`, {
        contactIds,
    });
};

export const removeContactsFromGroup = async (
    deviceId: string,
    groupId: string,
    contactIds: string[]
): Promise<void> => {
    await api.post(`/devices/${deviceId}/contacts/groups/${groupId}/remove`, {
        contactIds,
    });
};

export const exportContacts = async (
    deviceId: string,
    format: 'vcf' | 'csv' | 'json' = 'vcf',
    filter?: ContactFilter
): Promise<Blob> => {
    const response = await api.get(`/devices/${deviceId}/contacts/export`, {
        params: { ...filter, format },
        responseType: 'blob',
    });
    return response.data;
};

export const importContacts = async (
    deviceId: string,
    file: File,
    options?: {
        groupId?: string;
        skipDuplicates?: boolean;
        accountType?: string;
        accountName?: string;
    }
): Promise<{ imported: number; skipped: number; failed: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    if (options) {
        Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined) {
                formData.append(key, value.toString());
            }
        });
    }

    const response = await api.post(`/devices/${deviceId}/contacts/import`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const deleteAllContacts = async (deviceId: string): Promise<{ deleted: number }> => {
    const response = await api.delete(`/devices/${deviceId}/contacts`);
    return response.data;
};

export const getContactFrequents = async (
    deviceId: string,
    limit: number = 25
): Promise<Array<{ contactId: string; timesContacted: number; lastTimeContacted: string }>> => {
    const response = await api.get(`/devices/${deviceId}/contacts/frequents`, {
        params: { limit },
    });
    return response.data;
};

export const getContactPhoto = async (
    deviceId: string,
    contactId: string
): Promise<Blob> => {
    const response = await api.get(`/devices/${deviceId}/contacts/${contactId}/photo`, {
        responseType: 'blob',
    });
    return response.data;
};

export const setContactPhoto = async (
    deviceId: string,
    contactId: string,
    photoFile: File
): Promise<void> => {
    const formData = new FormData();
    formData.append('photo', photoFile);

    await api.post(
        `/devices/${deviceId}/contacts/${contactId}/photo`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
};

export const deleteContactPhoto = async (
    deviceId: string,
    contactId: string
): Promise<void> => {
    await api.delete(`/devices/${deviceId}/contacts/${contactId}/photo`);
};
