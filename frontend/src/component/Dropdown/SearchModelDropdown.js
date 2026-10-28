import React, { useState, useEffect } from "react";
import { Dropdown } from "semantic-ui-react";
import { useSelector } from "react-redux";

const SearchModelDropdown = ({ getValue, optionsType }) => {
  const clients = useSelector((state) => state.map.clients);
  const pops = useSelector((state) => state.map.pops);
  const tjboxs = useSelector((state) => state.map.tjboxs);
  const resellers = useSelector((state) => state.map.resellers);

  const [value, setValue] = useState(null);
  const optionSelection = {
    CLIENT: clients,
    POP: pops,
    TJ_BOX: tjboxs,
    RESELLER: resellers,
  };

  useEffect(() => {
    setValue(null);
  }, [optionsType]);

  const options = optionSelection[optionsType]
    ? optionSelection[optionsType].map((item) => {
        return {
          key: item.id,
          text: item.identifier,
          value: item.id,
        };
      })
    : [];

  const handleChange = (e, { value }) => {
    setValue(value);
    getValue(value);
  };

  return (
    <Dropdown
      selection
      fluid
      labeled
      options={options}
      search
      onChange={handleChange}
      placeholder="Select starting point"
      value={value}
    />
  );
};

export default React.memo(SearchModelDropdown);
