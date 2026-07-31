import { useSyncExternalStore } from "react";

let search = "";
let showSearch = false;
let searchData = { search, showSearch };
const searchListeners = new Set();

const updateSearchView = () => searchListeners.forEach(listener => listener());

const listenSearchChange = (listener) => {
  searchListeners.add(listener);
  return () => searchListeners.delete(listener);
};

const getSearchData = () => searchData;

const updateSearchState = () => {
  searchData = { search, showSearch };
};

export const setSearch = (searchValue) => {
  search = searchValue;
  updateSearchState();
  updateSearchView();
};

export const setShowSearch = (showSearchValue) => {
  showSearch = showSearchValue;
  updateSearchState();
  updateSearchView();
};

const useSearch = () => {
  const searchValue = useSyncExternalStore(listenSearchChange, getSearchData);

  return { search: searchValue.search, setSearch, showSearch: searchValue.showSearch, setShowSearch };
};

export default useSearch;
