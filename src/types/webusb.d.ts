// Tipos básicos para WebUSB
// Se o projeto já tiver @types/w3c-web-usb, isso não seria necessário, mas garante compilação.

interface USBDevice {
    opened: boolean;
    vendorId: number;
    productId: number;
    productName?: string;
    configuration: USBConfiguration | null;
    configurations: USBConfiguration[];
    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    releaseInterface(interfaceNumber: number): Promise<void>;
    transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
}

interface USBConfiguration {
    configurationValue: number;
    interfaces: USBInterface[];
}

interface USBInterface {
    interfaceNumber: number;
    alternate: USBAlternateInterface;
}

interface USBAlternateInterface {
    interfaceClass: number;
    interfaceSubclass: number;
    interfaceProtocol: number;
    endpoints: USBEndpoint[];
}

interface USBEndpoint {
    endpointNumber: number;
    direction: "in" | "out";
    type: "bulk" | "interrupt" | "isochronous";
}

interface USBOutTransferResult {
    bytesWritten: number;
    status: "ok" | "stall" | "babble";
}

interface Navigator {
    usb: USBSystem;
}

interface USBSystem {
    getDevices(): Promise<USBDevice[]>;
    requestDevice(options?: USBDeviceRequestOptions): Promise<USBDevice>;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
}

interface USBDeviceRequestOptions {
    filters: USBDeviceFilter[];
}

interface USBDeviceFilter {
    vendorId?: number;
    productId?: number;
    classCode?: number;
    subclassCode?: number;
    protocolCode?: number;
    serialNumber?: string;
}
