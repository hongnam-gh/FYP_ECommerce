export const emptyAdvancedFilters = {
  availability: [],
  materials: [],
  colors: [],
  sizes: [],
  subCategories: []
}

export const normalizeSubCategory = (subCategory) => {
  const subCategoryMap = {
    Topwear: 'Tops & Shirts',
    TopsShirts: 'Tops & Shirts',
    Winterwear: 'Outerwear & Jacket',
    Outerwears: 'Outerwear & Jacket',
    Bottomwear: 'Bottom Wear',
    CharmsStuff: 'Charms & Stuff'
  }

  return subCategoryMap[subCategory] || subCategory
}
