import {
  deleteLink as apiDeleteLink,
  updateLink as apiUpdateLink,
  createShortLink,
} from '../services/shortUrl'; // 引入 API 方法

export default function useShortLinks() {
  const addLink = async (values: any) => {
    const response = await createShortLink(values); // 调用创建短链接的 API
    if (response) {
      return true;
    }
    return false;
  };

  const deleteLink = async (id: string) => {
    await apiDeleteLink(id); // 调用删除短链接的 API
    return true;
  };

  // 修改函数名避免与导入的 updateLink 冲突
  const updateShortLink = async ({
    id,
    data,
  }: {
    id: string;
    data: {
      longUrls: string[];
      customShortKey?: string;
      remark?: string;
      customDomain?: string;
    };
  }) => {
    const response = await apiUpdateLink(id, data);
    if (response) {
      return true;
    }
    return false;
  };

  return { addLink, deleteLink, updateLink: updateShortLink };
}
