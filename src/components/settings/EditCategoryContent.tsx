import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MultiSelectSheet } from "@/components/ui/multi-select-sheet";

interface Category {
  id: string;
  name: string;
  parent: string;
  position: number;
  course: number | null;
  archived: boolean;
}

interface EditCategoryContentProps {
  category: Category;
  onBack: () => void;
  onSave: (category: {
    id: string;
    name: string;
    position: number | null;
    courseName: string;
    coursePosition: number | null;
    menuDisplayName: string;
    assignedPrinters: string[];
    parentCategory: string;
    products: string[];
  }) => void;
}

const EditCategoryContent = ({ category, onBack, onSave }: EditCategoryContentProps) => {
  const [name, setName] = useState(category.name);
  const [position, setPosition] = useState<number | null>(category.position);
  const [courseName, setCourseName] = useState("");
  const [coursePosition, setCoursePosition] = useState<number | null>(category.course);
  const [menuDisplayName, setMenuDisplayName] = useState(category.name);
  const [selectedPrinters, setSelectedPrinters] = useState<string[]>([]);
  const [selectedParentCategory, setSelectedParentCategory] = useState<string[]>(
    category.parent !== "-" ? [category.parent] : []
  );
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const [showPrintersSheet, setShowPrintersSheet] = useState(false);
  const [showParentCategorySheet, setShowParentCategorySheet] = useState(false);
  const [showProductsSheet, setShowProductsSheet] = useState(false);

  const printerOptions = ["Kitchen Printer", "Bar Printer", "Receipt Printer", "Label Printer"];
  const categoryOptions = ["Food", "Drinks", "Desserts", "Appetizers", "Main Course", "Sides"];
  const productOptions = ["Burger", "Pizza", "Pasta", "Salad", "Coffee", "Tea", "Soda", "Wine", "Beer"];

  const handleBack = () => {
    if (name) {
      onSave({
        id: category.id,
        name,
        position,
        courseName,
        coursePosition,
        menuDisplayName,
        assignedPrinters: selectedPrinters,
        parentCategory: selectedParentCategory[0] || "",
        products: selectedProducts,
      });
    }
    onBack();
  };

  const formatSelection = (items: string[], placeholder: string) => {
    if (items.length === 0) return placeholder;
    if (items.length === 1) return items[0];
    return `${items.length} selected`;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-center py-4 px-4 relative">
        <button
          onClick={handleBack}
          className="absolute left-4 w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Edit Category</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
        {/* Category Name */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-4">
          <button className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity">
            <span className="text-foreground text-base font-medium">Category Name</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=""
                className="bg-transparent text-right text-foreground placeholder:text-neutral-500 outline-none text-base w-32"
                onClick={(e) => e.stopPropagation()}
              />
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>

        {/* Position */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <button className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity">
            <span className="text-foreground text-base font-medium">Position</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={position ?? ""}
                onChange={(e) => setPosition(e.target.value ? parseInt(e.target.value) : null)}
                placeholder=""
                className="bg-transparent text-right text-foreground placeholder:text-neutral-500 outline-none text-base w-20"
                onClick={(e) => e.stopPropagation()}
              />
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Set the order in which the category appears on the POS screen. Lower numbers usually appear first.
        </p>

        {/* Course Name */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <button className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity">
            <span className="text-foreground text-base font-medium">Course Name</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder=""
                className="bg-transparent text-right text-foreground placeholder:text-neutral-500 outline-none text-base w-32"
                onClick={(e) => e.stopPropagation()}
              />
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Assign the category to a specific course, such as Appetiser, Main Course, or Dessert. This helps organise kitchen preparation and service flow.
        </p>

        {/* Course Position */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <button className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity">
            <span className="text-foreground text-base font-medium">Course Position</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={coursePosition ?? ""}
                onChange={(e) => setCoursePosition(e.target.value ? parseInt(e.target.value) : null)}
                placeholder=""
                className="bg-transparent text-right text-foreground placeholder:text-neutral-500 outline-none text-base w-20"
                onClick={(e) => e.stopPropagation()}
              />
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Set the serving order of the course. For example, Starters may come before Mains.
        </p>

        {/* Menu Display Name */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <button className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity">
            <span className="text-foreground text-base font-medium">Menu Display Name</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={menuDisplayName}
                onChange={(e) => setMenuDisplayName(e.target.value)}
                placeholder=""
                className="bg-transparent text-right text-foreground placeholder:text-neutral-500 outline-none text-base w-32"
                onClick={(e) => e.stopPropagation()}
              />
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Enter a custom name if you want this category to appear differently on the menu display. Useful for customer-facing screens or online menus.
        </p>

        {/* Assigned Printer */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowPrintersSheet(true)}
          >
            <span className="text-foreground text-base font-medium">Assigned Printer</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-base">{formatSelection(selectedPrinters, "Select Printers")}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Select which printer should receive orders from this category. For example, bar items can print at the bar printer, and kitchen items at the kitchen printer.
        </p>

        {/* Parent Category */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowParentCategorySheet(true)}
          >
            <span className="text-foreground text-base font-medium">Parent Category</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-base">{formatSelection(selectedParentCategory, "Select Category")}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Assign this category under another main category. This helps create sub-categories for better organisation.
        </p>

        {/* Products */}
        <div className="bg-neutral-800/60 rounded-2xl overflow-hidden mb-1">
          <button
            className="w-full flex items-center justify-between py-4 px-4 active:opacity-70 transition-opacity"
            onClick={() => setShowProductsSheet(true)}
          >
            <span className="text-foreground text-base font-medium">Products</span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 text-base">{formatSelection(selectedProducts, "Select Products")}</span>
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </div>
          </button>
        </div>
        <p className="text-neutral-500 text-sm px-1 mt-1.5 mb-6">
          Select the products that belong to this category. Only selected items will appear under this category in the menu.
        </p>
      </div>

      {/* Printers Sheet */}
      <MultiSelectSheet
        isOpen={showPrintersSheet}
        onClose={(selected) => {
          setSelectedPrinters(selected);
          setShowPrintersSheet(false);
        }}
        title="Select Printers"
        options={printerOptions}
        initialSelected={selectedPrinters}
      />

      {/* Parent Category Sheet */}
      <MultiSelectSheet
        isOpen={showParentCategorySheet}
        onClose={(selected) => {
          setSelectedParentCategory(selected.slice(0, 1)); // Only allow single selection
          setShowParentCategorySheet(false);
        }}
        title="Select Parent Category"
        options={categoryOptions}
        initialSelected={selectedParentCategory}
      />

      {/* Products Sheet */}
      <MultiSelectSheet
        isOpen={showProductsSheet}
        onClose={(selected) => {
          setSelectedProducts(selected);
          setShowProductsSheet(false);
        }}
        title="Select Products"
        options={productOptions}
        initialSelected={selectedProducts}
      />
    </div>
  );
};

export default EditCategoryContent;
