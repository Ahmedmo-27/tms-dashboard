import { tms } from "@/lib/tms-api";
import { Class } from "@/components/ui/classes/columns";

export const getClasses = async (locationId?: string) => {
  try {
    const params = locationId ? { locationId } : undefined;
    const response = await tms.get("/admin/class", { params });
    return response.data.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const addClass = async (cls: Class) => {
  try {
    const requestBody = {
      title: cls.title,
      price: cls.price,
      category: cls.category,
      locations: cls.locations,
    };
    const response = await tms.post("admin/class", requestBody);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const editClass = async (cls: Class) => {
  try {
    const requestBody = {
      title: cls.title,
      price: cls.price,
      category: cls.category,
      locations: cls.locations,
    };
    const response = await tms.patch(`admin/class/${cls._id}`, requestBody);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteClass = async (classId: string) => {
  try {
    const response = await tms.delete(`admin/class/${classId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
