import api from './api';

export interface NetworkInfo {
    type: NetworkType;
    subtype?: NetworkSubtype;
    isConnected: boolean;
    isFailover: boolean;
    isRoaming: boolean;
    isAvailable: boolean;
    isMetered?: boolean;
    isSuspended?: boolean;
    isVpn?: boolean;
    isPrivateDnsActive?: boolean;
    isPrivateDnsBroken?: boolean;
    hasCarrierPrivileges?: boolean;
}

export interface NetworkCapabilities {
    transportTypes: TransportType[];
    transportInfo?: TransportInfo;
    networkCapabilities: NetworkCapability[];
    signalStrength?: number;
    linkUpstreamBandwidthKbps?: number;
    linkDownstreamBandwidthKbps?: number;
    networkSpecifier?: string;
    ssid?: string;
    bssid?: string;
    rssi?: number;
    frequency?: number;
    linkSpeed?: number;
    ipAddress?: string;
    macAddress?: string;
    subnetMask?: string;
    dns1?: string;
    dns2?: string;
    gateway?: string;
    dhcpLeaseDuration?: number;
    serverAddress?: string;
    domainName?: string;
}

export interface TransportInfo {
    type: TransportType;
    extraInfo?: string;
}

export interface NetworkRequest {
    capabilities: NetworkCapability[];
    transportTypes: TransportType[];
    networkSpecifier?: string;
}

export interface NetworkCallback {
    onAvailable?: (network: NetworkInfo) => void;
    onLost?: (network: NetworkInfo) => void;
    onCapabilitiesChanged?: (network: NetworkInfo, capabilities: NetworkCapabilities) => void;
    onLinkPropertiesChanged?: (network: NetworkInfo, properties: LinkProperties) => void;
    onUnavailable?: () => void;
}

export interface LinkProperties {
    interfaceName?: string;
    linkAddresses: LinkAddress[];
    dnsServers: string[];
    domains?: string;
    mtu?: number;
    tcpBufferSizes?: string;
    nat64Prefix?: string;
    routes: RouteInfo[];
    httpProxy?: ProxyInfo;
}

export interface LinkAddress {
    address: string;
    prefixLength: number;
    flags: number;
    scope: number;
}

export interface RouteInfo {
    destination: LinkAddress;
    gateway: string;
    interface: string;
    isDefaultRoute: boolean;
}

export interface ProxyInfo {
    host: string;
    port: number;
    exclusionList: string[];
}

export interface WifiInfo {
    ssid: string;
    bssid: string;
    rssi: number;
    frequency: number;
    linkSpeed: number;
    networkId: number;
    ipAddress: number;
    macAddress: string;
    hiddenSSID: boolean;
    supplicantState: SupplicantState;
    wifiStandard: WifiStandard;
    currentSecurityType: WifiSecurityType;
    txLinkSpeedMbps: number;
    rxLinkSpeedMbps: number;
    channelBandwidth: number;
    timestamp: number;
}

export interface WifiConfiguration {
    networkId: number;
    status: WifiConfigurationStatus;
    SSID: string;
    BSSID: string;
    preSharedKey?: string;
    wepKeys?: string[];
    wepTxKeyIndex: number;
    priority: number;
    hiddenSSID: boolean;
    allowedKeyManagement: WifiKeyManagement[];
    allowedProtocols: WifiProtocol[];
    allowedAuthAlgorithms: WifiAuthAlgorithm[];
    allowedPairwiseCiphers: WifiPairwiseCipher[];
    allowedGroupCiphers: WifiGroupCipher[];
    enterpriseConfig?: WifiEnterpriseConfig;
    isPasspoint: boolean;
    isHomeProviderNetwork: boolean;
    isLegacyPasspointConfig: boolean;
    creatorUid: number;
    creatorPackageName: string;
    creationTime: string;
    updateTime: string;
    lastConnectTime: string;
    lastUpdateTime: string;
    lastDisconnectedTime: string;
    numRebootsSinceLastUse: number;
    ephemeral: boolean;
    trusted: boolean;
    fromWifiNetworkSuggestion: boolean;
    fromWifiNetworkSpecifier: boolean;
    meteredHint: boolean;
    useExternalScores: boolean;
    validatedInternetAccess: boolean;
    noInternetAccessExpected: boolean;
}

export interface WifiEnterpriseConfig {
    eapMethod: WifiEapMethod;
    phase2Method: WifiPhase2Method;
    identity: string;
    anonymousIdentity: string;
    password: string;
    caCertificate: string;
    clientCertificate: string;
    privateKey: string;
    subjectMatch: string;
    altSubjectMatch: string;
    domainSuffixMatch: string;
    realm: string;
    plmn: string;
    caPath: string;
    clientKeyPairAlias: string;
    engine: number;
    engineId: string;
    caCertificateAliases: string[];
    altsubjectMatch: string;
    domainMatch: string;
    caCertificateAlias: string;
}

export interface ScanResult {
    SSID: string;
    BSSID: string;
    capabilities: string;
    frequency: number;
    level: number;
    timestamp: number;
    channelWidth: number;
    centerFreq0: number;
    centerFreq1: number;
    operatorFriendlyName: string;
    venueName: string;
    is80211mcResponder: boolean;
    isPasspointNetwork: boolean;
    isCarrierAp: boolean;
    carrierApEapType: number;
    carrierName: string;
    carrierId: number;
    isEmergencyCapable: boolean;
    isWpsConfigured: boolean;
    isWpsPbcSupported: boolean;
    isWpsKeypadSupported: boolean;
    isWpsDisplaySupported: boolean;
    isWpsPushButtonSupported: boolean;
    isWpsPinKeypadSupported: boolean;
    isWpsPinDisplaySupported: boolean;
    isWpsP2pSupported: boolean;
    isWpsP2pNfcSupported: boolean;

}

export enum NetworkType {
    BLUETOOTH = 'BLUETOOTH',
    CELLULAR = 'CELLULAR',
    ETHERNET = 'ETHERNET',
    LOWPAN = 'LOWPAN',
    VPN = 'VPN',
    WIFI = 'WIFI',
    WIFI_AWARE = 'WIFI_AWARE',
    WIFI_P2P = 'WIFI_P2P',
    WIGIG = 'WIGIG',
    UNKNOWN = 'UNKNOWN',
}

export enum NetworkSubtype {
    // Cellular
    UNKNOWN = 'UNKNOWN',
    GPRS = 'GPRS',
    EDGE = 'EDGE',
    UMTS = 'UMTS',
    CDMA = 'CDMA',
    EVDO_0 = 'EVDO_0',
    EVDO_A = 'EVDO_A',
    ONE_X_RTT = '1xRTT',
    HSDPA = 'HSDPA',
    HSUPA = 'HSUPA',
    HSPA = 'HSPA',
    IDEN = 'IDEN',
    EVDO_B = 'EVDO_B',
    LTE = 'LTE',
    EHRPD = 'EHRPD',
    HSPAP = 'HSPAP',
    GSM = 'GSM',
    TD_SCDMA = 'TD_SCDMA',
    IWLAN = 'IWLAN',
    LTE_CA = 'LTE_CA',
    NR = 'NR',
    // Wifi
    WIFI_RTT = 'WIFI_RTT',
    WIFI_P2P = 'WIFI_P2P',
    WIFI_AWARE = 'WIFI_AWARE',
    WIFI_PASSPOINT = 'WIFI_PASSPOINT',
}

export enum TransportType {
    BLUETOOTH = 'BLUETOOTH',
    CELLULAR = 'CELLULAR',
    ETHERNET = 'ETHERNET',
    LOWPAN = 'LOWPAN',
    VPN = 'VPN',
    WIFI = 'WIFI',
    WIFI_AWARE = 'WIFI_AWARE',
    WIFI_P2P = 'WIFI_P2P',
    WIGIG = 'WIGIG',
}

export enum NetworkCapability {
    INTERNET = 'INTERNET',
    TRUSTED = 'TRUSTED',
    NOT_METERED = 'NOT_METERED',
    NOT_ROAMING = 'NOT_ROAMING',
    FOREGROUND = 'FOREGROUND',
    NOT_CONGESTED = 'NOT_CONGESTED',
    NOT_SUSPENDED = 'NOT_SUSPENDED',
    NOT_VPN = 'NOT_VPN',
    VALIDATED = 'VALIDATED',
    CAPTIVE_PORTAL = 'CAPTIVE_PORTAL',
    NOT_RESTRICTED = 'NOT_RESTRICTED',
    NOT_VCN_MANAGED = 'NOT_VCN_MANAGED',
    TEMPORARILY_NOT_METERED = 'TEMPORARILY_NOT_METERED',
    OTA = 'OTA',
    WIFI_P2P = 'WIFI_P2P',
    LOCAL_NETWORK = 'LOCAL_NETWORK',
    NOT_CAPABLE = 'NOT_CAPABLE',
    LOW_LATENCY = 'LOW_LATENCY',
    LOW_POWER = 'LOW_POWER',
    HIGH_PRIORITY = 'HIGH_PRIORITY',
    ENTERPRISE = 'ENTERPRISE',
    MMS = 'MMS',
    SUPL = 'SUPL',
    DUN = 'DUN',
    FOTA = 'FOTA',
    IMS = 'IMS',
    CBS = 'CBS',
    IA = 'IA',
    EMERGENCY = 'EMERGENCY',
    MCX = 'MCX',
    VSIM = 'VSIM',
    BIP = 'BIP',
}

export enum WifiSecurityType {
    OPEN = 'OPEN',
    WEP = 'WEP',
    WPA_PSK = 'WPA_PSK',
    WPA_EAP = 'WPA_EAP',
    WPA2_PSK = 'WPA2_PSK',
    WPA2_EAP = 'WPA2_EAP',
    WPA3_SAE = 'WPA3_SAE',
    WPA3_OWE = 'WPA3_OWE',
    WPA3_ENTERPRISE = 'WPA3_ENTERPRISE',
    WAPI_PSK = 'WAPI_PSK',
    WAPI_CERT = 'WAPI_CERT',
}

export enum WifiKeyManagement {
    NONE = 'NONE',
    WPA_PSK = 'WPA_PSK',
    WPA_EAP = 'WPA_EAP',
    IEEE8021X = 'IEEE8021X',
    WPA2_PSK = 'WPA2_PSK',
    OSEN = 'OSEN',
    SAE = 'SAE',
    OWE = 'OWE',
    WAPI_PSK = 'WAPI_PSK',
    WAPI_CERT = 'WAPI_CERT',
}

export enum WifiProtocol {
    RSN = 'RSN',
    WPA = 'WPA',
    OSEN = 'OSEN',
    WAPI = 'WAPI',
}

export enum WifiAuthAlgorithm {
    OPEN = 'OPEN',
    SHARED = 'SHARED',
    LEAP = 'LEAP',
}

export enum WifiPairwiseCipher {
    NONE = 'NONE',
    TKIP = 'TKIP',
    CCMP = 'CCMP',
    GCMP_256 = 'GCMP_256',
    GCMP_128 = 'GCMP_128',
    SMS4 = 'SMS4',
}

export enum WifiGroupCipher {
    WEP40 = 'WEP40',
    WEP104 = 'WEP104',
    TKIP = 'TKIP',
    CCMP = 'CCMP',
    GCMP_256 = 'GCMP_256',
    GCMP_128 = 'GCMP_128',
    SMS4 = 'SMS4',
}

export enum WifiEapMethod {
    PEAP = 'PEAP',
    TLS = 'TLS',
    TTLS = 'TTLS',
    PWD = 'PWD',
    SIM = 'SIM',
    AKA = 'AKA',
    AKA_PRIME = 'AKA_PRIME',
    UNAUTH_TLS = 'UNAUTH_TLS',
}

export enum WifiPhase2Method {
    NONE = 'NONE',
    PAP = 'PAP',
    MSCHAP = 'MSCHAP',
    MSCHAPV2 = 'MSCHAPV2',
    GTC = 'GTC',
    SIM = 'SIM',
    AKA = 'AKA',
    AKA_PRIME = 'AKA_PRIME',
}

export enum WifiConfigurationStatus {
    CURRENT = 'CURRENT',
    DISABLED = 'DISABLED',
    ENABLED = 'ENABLED',
}

export enum SupplicantState {
    DISCONNECTED = 'DISCONNECTED',
    INTERFACE_DISABLED = 'INTERFACE_DISABLED',
    INACTIVE = 'INACTIVE',
    SCANNING = 'SCANNING',
    AUTHENTICATING = 'AUTHENTICATING',
    ASSOCIATING = 'ASSOCIATING',
    ASSOCIATED = 'ASSOCIATED',
    FOUR_WAY_HANDSHAKE = 'FOUR_WAY_HANDSHAKE',
    GROUP_HANDSHAKE = 'GROUP_HANDSHAKE',
    COMPLETED = 'COMPLETED',
    DISCONNECTING = 'DISCONNECTING',
    UNINITIALIZED = 'UNINITIALIZED',
    INVALID = 'INVALID',
}

export enum WifiStandard {
    LEGACY = 'LEGACY',
    _11N = '11N',
    _11AC = '11AC',
    _11AX = '11AX',
    _11BE = '11BE',
    UNKNOWN = 'UNKNOWN',
}

/**
 * Get current network info
 */
export const getNetworkInfo = async (deviceId: string): Promise<NetworkInfo> => {
    const response = await api.get(`/devices/${deviceId}/network/info`);
    return response.data;
};

/**
 * Get network capabilities
 */
export const getNetworkCapabilities = async (
    deviceId: string
): Promise<NetworkCapabilities> => {
    const response = await api.get(`/devices/${deviceId}/network/capabilities`);
    return response.data;
};

/**
 * Get current WiFi connection info
 */
export const getWifiInfo = async (deviceId: string): Promise<WifiInfo> => {
    const response = await api.get(`/devices/${deviceId}/network/wifi/info`);
    return response.data;
};

/**
 * Scan for available WiFi networks
 */
export const scanWifiNetworks = async (deviceId: string): Promise<ScanResult[]> => {
    const response = await api.post(`/devices/${deviceId}/network/wifi/scan`);
    return response.data;
};

/**
 * Get saved WiFi networks
 */
export const getConfiguredNetworks = async (deviceId: string): Promise<WifiConfiguration[]> => {
    const response = await api.get(`/devices/${deviceId}/network/wifi/configured-networks`);
    return response.data;
};

/**
 * Connect to a WiFi network
 */
export const connectToWifi = async (
    deviceId: string,
    ssid: string,
    password?: string,
    securityType: WifiSecurityType = WifiSecurityType.OPEN
): Promise<{ success: boolean; message?: string }> => {
    const response = await api.post(`/devices/${deviceId}/network/wifi/connect`, {
        ssid,
        password,
        securityType,
    });
    return response.data;
};

/**
 * Disconnect from current WiFi network
 */
export const disconnectWifi = async (deviceId: string): Promise<void> => {
    await api.post(`/devices/${deviceId}/network/wifi/disconnect`);
};

/**
 * Forget a saved WiFi network
 */
export const forgetWifiNetwork = async (
    deviceId: string,
    networkId: number
): Promise<{ success: boolean }> => {
    const response = await api.post(`/devices/${deviceId}/network/wifi/forget`, { networkId });
    return response.data;
};

/**
 * Enable/disable WiFi
 */
export const setWifiEnabled = async (
    deviceId: string,
    enabled: boolean
): Promise<{ success: boolean }> => {
    const response = await api.post(`/devices/${deviceId}/network/wifi/set-enabled`, { enabled });
    return response.data;
};

/**
 * Get mobile data status
 */
export const getMobileDataStatus = async (deviceId: string): Promise<{ enabled: boolean }> => {
    const response = await api.get(`/devices/${deviceId}/network/mobile/status`);
    return response.data;
};

/**
 * Enable/disable mobile data
 */
export const setMobileDataEnabled = async (
    deviceId: string,
    enabled: boolean
): Promise<{ success: boolean }> => {
    const response = await api.post(`/devices/${deviceId}/network/mobile/set-enabled`, { enabled });
    return response.data;
};

/**
 * Get mobile network type
 */
export const getMobileNetworkType = async (deviceId: string): Promise<NetworkSubtype> => {
    const response = await api.get(`/devices/${deviceId}/network/mobile/type`);
    return response.data.type;
};

/**
 * Get signal strength
 */
export const getSignalStrength = async (deviceId: string): Promise<{ dbm: number; asu: number; level: number }> => {
    const response = await api.get(`/devices/${deviceId}/network/signal-strength`);
    return response.data;
};

/**
 * Get IP configuration
 */
export const getIpConfiguration = async (deviceId: string): Promise<LinkProperties> => {
    const response = await api.get(`/devices/${deviceId}/network/ip-config`);
    return response.data;
};

/**
 * Perform a network request to check connectivity
 */
export const checkConnectivity = async (deviceId: string, url?: string): Promise<{
    isConnected: boolean;
    type: NetworkType;
    subtype?: NetworkSubtype;
    extraInfo?: string;
    timestamp: number;
    responseTime?: number;
    statusCode?: number;
    error?: string;
}> => {
    const response = await api.get(`/devices/${deviceId}/network/check-connectivity`, {
        params: { url },
    });
    return response.data;
};

/**
 * Register a network callback
 */
export const registerNetworkCallback = async (
    deviceId: string,
    callback: NetworkCallback
): Promise<{ callbackId: string }> => {
    const response = await api.post(`/devices/${deviceId}/network/register-callback`, {
        callback,
    });
    return response.data;
};

/**
 * Unregister a network callback
 */
export const unregisterNetworkCallback = async (
    deviceId: string,
    callbackId: string
): Promise<{ success: boolean }> => {
    const response = await api.post(`/devices/${deviceId}/network/unregister-callback`, {
        callbackId,
    });
    return response.data;
};

export default {
    // Network Info
    getNetworkInfo,
    getNetworkCapabilities,
    getIpConfiguration,
    getSignalStrength,
    checkConnectivity,

    // WiFi
    getWifiInfo,
    scanWifiNetworks,
    getConfiguredNetworks,
    connectToWifi,
    disconnectWifi,
    forgetWifiNetwork,
    setWifiEnabled,

    // Mobile Data
    getMobileDataStatus,
    setMobileDataEnabled,
    getMobileNetworkType,

    // Callbacks
    registerNetworkCallback,
    unregisterNetworkCallback,
};