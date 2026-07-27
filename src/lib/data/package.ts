import { Package } from "@/components/ui/packages/columns";
import { tms } from "@/lib/tms-api";

export interface UpdatePackagePayload {
  _id: string;
  name?: string;
  numberOfSessions?: string;
  expiryPeriod?: string;
  price?: string;
  category?: string;
  hidden?: boolean;
  opensClasses?: string[];
  classRestrictions?: { cid: string; limit: number }[];
}

export const getPackages = async (locationId?: string): Promise<Package[]> => {
  try {
    const params = locationId ? { locationId } : undefined;
    const response = await tms.get("/admin/packages", { params });
    const packages = response.data.data as Package[];
    return packages.map((pkg) => ({
      ...pkg,
      branchLabel:
        typeof pkg.locationId === "object" && pkg.locationId
          ? pkg.locationId.branchName ?? pkg.locationId.location ?? undefined
          : undefined,
    }));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const addPackage = async (pkg: Package) => {
  try {
    const requestBody = {
      name: pkg.name,
      numberOfSessions: pkg.numberOfSessions,
      category: pkg.category,
      price: pkg.price,
      expiryPeriod: pkg.expiryPeriod,
      opensClasses: pkg.opensClasses,
      classRestrictions: pkg.classRestrictions,
    };
    const response = await tms.post("admin/packages", requestBody);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const changePackageVisibility = async (
  pkgId: string,
  hidden: boolean
) => {
  try {
    const response = await tms.patch(`admin/packages/${pkgId}`, {
      hidden,
    });
    return response.data;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const editPackage = async (pkg: UpdatePackagePayload) => {
  try {
    const { _id, ...updateFields } = pkg;

    const response = await tms.patch(
      `admin/packages/${_id}`,
      updateFields
    );

    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export async function deletePackage(packageId: string) {
  try {
    const response = await tms.delete(`admin/packages/${packageId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting package:", error);
    throw error;
  }
}
