import React from "react";
import { useSelector } from "react-redux";
import CheckboxGrid from "./CheckboxGrid";

const CategoryList = ({ selected, setSelected }) => {
  const categories = useSelector((state) => state.category.categories);

  return (
    <CheckboxGrid
      items={categories}
      selectedId={selected?.id}
      onToggle={(item) => setSelected(item.id === selected?.id ? null : item)}
    />
  );
};

export default CategoryList;
