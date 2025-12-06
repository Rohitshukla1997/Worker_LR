import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { getInventoryProductListApi } from "../data/data";
import SearchInput from "../../ReusableComponents/SearchInput";
import Table from "../../ReusableComponents/Table";
import SmartPagination from "../../ReusableComponents/SmartPagination";

const Inventory = () => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Fetch Inventory product list
  const { data: getInventoryProductList, isFetching } = useQuery({
    queryKey: [
      "getInventoryProductList",
      { search: searchQuery, page: currentPage, limit: itemsPerPage },
    ],
    queryFn: getInventoryProductListApi,
    keepPreviousData: true,

    //Data stays FRESH for 10 minutes (no refetch)
    staleTime: 10 * 60 * 1000, // 10 minutes

    //Data stays in cache for 10 minutes before being garbage-collected
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Set filtered data when API returns
  useEffect(() => {
    if (getInventoryProductList?.data) {
      setFilteredData(getInventoryProductList.data);
    }
  }, [getInventoryProductList]);

  const totalPages = getInventoryProductList?.totalPages || 1;

  // Table columns
  const columns = [
    { label: "Warehouse Name", key: "wareHouseName", sortable: true },
    { label: "Location", key: "location", sortable: true },
    { label: "Capacity Kg", key: "capacityKg", sortable: true },
    { label: "Product Name", key: "productName", sortable: true },
    { label: "Quantity Kg", key: "quantityKg", sortable: true },
    { label: "Bag Size Kg", key: "bagSizeKg", sortable: true },
    { label: "Total Bags", key: "totalBags", sortable: true },
    { label: "Total Quantity Kg", key: "totalQuantityKg", sortable: true },
  ];

  return (
    <>
      <div className="mb-3 w-100 d-flex justify-content-end">
        <div style={{ width: "250px" }}>
          {" "}
          {/* adjust width as needed */}
          <SearchInput
            searchQuery={searchQuery}
            setSearchQuery={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <Table
        title="Inventory Product List Section"
        columns={columns}
        filteredData={filteredData}
        setFilteredData={setFilteredData}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        isFetching={isFetching}
      />

      <SmartPagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          const newItems = value === -1 ? warehouseRes?.total || 9999 : value;
          setItemsPerPage(newItems);
          setCurrentPage(1);
        }}
      />
    </>
  );
};

export default Inventory;
