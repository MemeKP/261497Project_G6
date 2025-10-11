import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  MoreVertical,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import type { MenuItem, MenuResponse } from "../types";
import MenuFormModal from "./MenuFormModal";
import Portal from "./Portal";

const AdminMenuList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    null
  );
  // Fetch menu items
  const { data, isLoading, error } = useQuery<MenuResponse>({
    queryKey: ["admin_menu_items", searchQuery, categoryFilter],
    queryFn: async () => {
      const params: any = { page: 1, limit: 100, showAll: true };
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter !== "all") params.category = categoryFilter;

      const response = await axios.get(`/api/menu_items`, { params });
      return response.data;
    },
  });

  // Delete mutation
const deleteMutation = useMutation({
  mutationFn: async (menuId: number) => {
    console.log('Deleting menu with ID:', menuId, typeof menuId);
    const response = await axios.delete(`/api/menu_items/${menuId}`);
    return response.data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] });
    setOpenMenuId(null);
    alert('Menu deleted successfully!');
  },
  onError: (error: any) => {
    console.error('Delete error:', error);
    alert('Failed to delete menu: ' + (error.response?.data?.error || error.message));
  },
});


  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({
      id,
      isAvailable,
    }: {
      id: number;
      isAvailable: boolean;
    }) => {
      console.log("TOGGLE MENU ITEM ID:", id);

      await axios.put(`/api/menu_items/${id}`, {
        isAvailable: !isAvailable,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] });
    },
  });


  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this menu?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleAvailability = (item: MenuItem) => {
    toggleAvailabilityMutation.mutate({
      id: item.id,
      isAvailable: item.isAvailable ?? true,
    });
  };

  const menuItems = data?.data || [];
  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMenu = () => {
    setModalMode("create");
    setSelectedMenuItem(null);
    setIsModalOpen(true);
  };

  const handleEditMenu = (item: MenuItem) => {
    setModalMode("edit");
    setSelectedMenuItem(item);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMenuItem(null);
  };

  const [dropdownInfo, setDropdownInfo] = useState<{
  isOpen: boolean;
  itemId: number | null;
  position: { top: number; left: number } | null;
}>({
  isOpen: false,
  itemId: null,
  position: null
});

const handleMenuClick = (e: React.MouseEvent, itemId: number) => {
  const button = e.currentTarget as HTMLButtonElement;
  const rect = button.getBoundingClientRect();
  
  // คำนวณตำแหน่งแบบ fixed ที่ไม่เปลี่ยนแปลงเมื่อ scroll
  setDropdownInfo({
    isOpen: true,
    itemId,
    position: {
      top: rect.top + rect.height + 5, // ใต้ปุ่ม
      left: rect.left  + 50 // ขวาของปุ่ม
    }
  });
};

// ปิด dropdown เมื่อ scroll (optional)
useEffect(() => {
  const handleScroll = () => {
    if (dropdownInfo.isOpen) {
      setDropdownInfo({ isOpen: false, itemId: null, position: null });
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [dropdownInfo.isOpen]);
  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Menu List
          </h1>
          <p className="text-gray-600 text-lg">
            Total number of menu items: {filteredItems.length}
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
              >
                <option value="all">All</option>
                <option value="noodle">Noodle</option>
                <option value="sushi">Sushi & Sashimi</option>
                <option value="appetizer">Appetizers</option>
                <option value="dessert">Desserts</option>
                <option value="drink">Drinks</option>
              </select>
            </div>

            {/* Add Button */}
            <button
              className="flex items-center justify-center gap-2 bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
              onClick={handleAddMenu}
            >
              <Plus className="w-5 h-5" />
              Add menu
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Error: {error.message}
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <div className="relative bg-white overflow-x-auto rounded-lg shadow-sm">
            <div className="relative "></div>
            <div className=" ">
              <table className="w-full">
                <thead className="bg-emerald-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Menu not found!
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {String(index + 1).padStart(3, "0")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.name}
                              </p>
                              {item.isSignature && (
                                <span className="text-xs text-yellow-600">
                                  ⭐ Signature
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ฿{parseFloat(item.price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.category}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${item.isAvailable
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                              }`}
                          >
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={(e) => handleMenuClick(e, item.id)}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                        </td>


                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Portal อยู่นอกตารางเลย */}
        <Portal>
          {dropdownInfo.isOpen && dropdownInfo.position && (
            <>
              {/* Backdrop */}
              <div
                className="fixed  bg-opacity-10 inset-0 z-40"
                onClick={() => setDropdownInfo({ isOpen: false, itemId: null, position: null })}
              />

              {/* Dropdown Menu */}
              <div
                className="fixed z-555 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                style={{
                  top: dropdownInfo.position.top,
                  left: dropdownInfo.position.left,
                  transform: 'translateX(-100%)'
                }}
              >
                <button
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    const item = filteredItems.find(i => i.id === dropdownInfo.itemId);
                    if (item) handleEditMenu(item);
                    setDropdownInfo({ isOpen: false, itemId: null, position: null });
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  onClick={() => {
                    if (dropdownInfo.itemId) handleDelete(dropdownInfo.itemId);
                    setDropdownInfo({ isOpen: false, itemId: null, position: null });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </Portal>

        {/* Stats */}
        {!isLoading && !error && filteredItems.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">All Menu</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredItems.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-emerald-600">
                {filteredItems.filter((item) => item.isAvailable).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Out of stock</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredItems.filter((item) => !item.isAvailable).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-600">Signature</p>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredItems.filter((item) => item.isSignature).length}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MENU FORM MODAL */}
      <MenuFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        menuItem={selectedMenuItem}
        mode={modalMode}
      />
    </div>
  );
};

export default AdminMenuList;
