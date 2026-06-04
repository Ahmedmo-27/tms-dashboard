import { tms } from "../tms-api";

export const getProducts = async () => {
  try {
    const response: any = await tms.get("/admin/products");
    return response.data.data;
  } catch (e) {
    console.log(e);
    throw e;
  }
};
