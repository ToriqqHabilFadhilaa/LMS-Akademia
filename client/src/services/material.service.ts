import api from "./api";

import type {
    Material,
    MaterialsResponse,
} from "../types/course";

export const getMyMaterials = async (
    courseOfferingId: string
): Promise<Material[]> => {
    const response =
        await api.get<MaterialsResponse>(
            `/materials/my/${courseOfferingId}`
        );

    return response.data.data;
};