export type KioskOriginType = 'mappedinObject' | 'coordinate';

export type KioskUpsertInput = {
    kioskId: string;
    displayName: string;
    description: string | null;
    originType: KioskOriginType;
    originMappedinId: string | null;
    floorId: string | null;
    latitude: number | null;
    longitude: number | null;
    heading: number | null;
    defaultZoom: number | null;
    isActive: boolean;
};

export type KioskConfig = KioskUpsertInput & {
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string | null;
};

export type PublicKioskConfig = Pick<KioskConfig,
    | 'kioskId'
    | 'displayName'
    | 'description'
    | 'originType'
    | 'originMappedinId'
    | 'floorId'
    | 'latitude'
    | 'longitude'
    | 'heading'
    | 'defaultZoom'
    | 'isActive'
>;
