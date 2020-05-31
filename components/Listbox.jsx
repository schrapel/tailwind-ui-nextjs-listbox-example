import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  useRef,
  createElement,
} from 'react';
import debounce from 'debounce';

let id = 0;

function generateId() {
  return `tailwind-ui-listbox-id-${++id}`;
}

function isString(value) {
  return typeof value === 'string' || value instanceof String;
}

function useId() {
  const [id] = useState(generateId());

  return id;
}

function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

const ListboxContext = createContext();

const useListboxProvider = (value, onChange) => {
  // TODO: Consider using useReducer instead of setData and spread operators.
  // TODO: Check how often the components are rerendering and possibly add useMemo/useCallback.
  const [data, setData] = useState({
    typeahead: '',
    listboxButtonRef: null,
    listboxListRef: null,
    isOpen: false,
    activeItem: value,
    values: null,
    labelId: null,
    buttonId: null,
    optionIds: [],
    optionRefs: [],
  });

  const getActiveDescendant = () => {
    const [_value, id] = data.optionIds.find(([value]) => {
      return value === data.activeItem;
    }) || [null, null];

    return id;
  };

  const registerOptionId = (value, optionId) => {
    unregisterOptionId(value);
    setData((prevData) => ({ ...prevData, optionIds: [...prevData.optionIds, [value, optionId]] }));
  };

  const unregisterOptionId = (value) => {
    setData((prevData) => ({
      ...prevData,
      optionIds: prevData.optionIds.filter(([candidateValue]) => {
        return candidateValue !== value;
      }),
    }));
  };

  const registerOptionRef = (value, optionRef) => {
    unregisterOptionRef(value);
    setData((prevData) => ({
      ...prevData,
      optionRefs: [...prevData.optionRefs, [value, optionRef]],
    }));
  };

  const unregisterOptionRef = (value) => {
    setData((prevData) => ({
      ...prevData,
      optionRefs: prevData.optionRefs.filter(([candidateValue]) => {
        return candidateValue !== value;
      }),
    }));
  };

  const toggle = () => {
    data.isOpen ? close() : open();
  };

  const open = () => {
    setData((prevData) => ({ ...prevData, isOpen: true }));
    focus(value);
    setTimeout(() => {
      data.listboxListRef.current.focus();
    }, 0);
  };

  const close = () => {
    setData((prevData) => ({ ...prevData, isOpen: false }));
    data.listboxButtonRef.current.focus();
  };

  const focus = (value) => {
    setData((prevData) => ({ ...prevData, activeItem: value }));

    if (value === null) {
      return;
    }

    setTimeout(() => {
      data.listboxListRef.current.children[data.values.indexOf(value)].scrollIntoView({
        block: 'nearest',
      });
    }, 0);
  };

  const select = (value) => {
    onChange(value);
    setTimeout(() => {
      close();
    }, 0);
  };

  const type = (value) => {
    setData((prevData) => ({ ...prevData, typeahead: prevData.typeahead + value }));

    const [match] = data.optionRefs.find(([_value, ref]) => {
      return ref.current.innerText.toLowerCase().includes(data.typeahead.toLowerCase());
    }) || [null];

    if (match !== null) {
      focus(match);
    }

    clearTypeahead();
  };

  const clearTypeahead = debounce(function () {
    setData((prevData) => ({ ...prevData, typeahead: '' }));
  }, 500);

  return {
    getActiveDescendant,
    registerOptionId,
    unregisterOptionId,
    registerOptionRef,
    unregisterOptionRef,
    toggle,
    open,
    close,
    select,
    focus,
    type,
    clearTypeahead,
    setData,
    ...data,
    props: { value, onChange },
  };
};

export function Listbox({ children, value, onChange, ...props }) {
  const listbox = useListboxProvider(value, onChange);
  return (
    <ListboxContext.Provider value={listbox}>
      <div {...props}>{children}</div>
    </ListboxContext.Provider>
  );
}

export function useListbox() {
  return useContext(ListboxContext);
}

export function ListboxLabel(props) {
  const { setData } = useListbox();
  const id = useId();
  useEffect(() => setData((prevData) => ({ ...prevData, labelId: id })), []);

  return createElement('span', { id, ...props });
}

export function ListboxButton({ children, ...props }) {
  const { labelId, isOpen, setData, toggle } = useListbox();
  const id = useId();
  const [isFocused, setIsFocused] = useState(false);
  const listboxButtonRef = useRef(null);

  useEffect(() => {
    setData((prevData) => ({ ...prevData, listboxButtonRef, buttonId: id }));
  }, []);

  return createElement('button', {
    children:
      typeof children === 'function' ? createElement(children, { isFocused, isOpen }) : children,
    onClick: () => toggle(),
    ref: listboxButtonRef,
    id,
    type: 'button',
    'aria-haspopup': 'listbox',
    'aria-labelledby': `${labelId} ${id}`,
    ...(isOpen ? { 'aria-expanded': 'true' } : {}),
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    ...props,
  });
}

export function ListboxList({ children, ...props }) {
  const {
    isOpen,
    activeItem,
    listboxButtonRef,
    typeahead,
    setData,
    close,
    focus,
    type,
    select,
    getActiveDescendant,
  } = useListbox();
  const listboxListRef = useRef(null);
  const values = children.map((node) => node.props.value);
  const focusedIndex = values.indexOf(activeItem);

  useEffect(() => {
    setData((prevData) => ({ ...prevData, listboxListRef, values }));
  }, []);

  return createElement('ul', {
    children,
    ref: listboxListRef,
    tabIndex: '-1',
    role: 'listbox',
    'aria-activedescendant': getActiveDescendant(),
    // https://github.com/tailwindui/vue/blob/master/src/Listbox.js#L101
    // The code never references this so not sure what to map the value to.
    // 'aria-labelledby': this.context.props.labelledby,
    style: {
      display: isOpen ? 'block' : 'none',
    },
    onBlur: (e) => {
      if (e.relatedTarget === listboxButtonRef.current) {
        return;
      }
      close();
    },
    onMouseLeave: () => {
      setData((prevData) => ({ ...prevData, activeItem: null }));
    },
    onKeyDown: (e) => {
      let indexToFocus;
      switch (e.key) {
        case 'Esc':
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'Tab':
          e.preventDefault();
          break;
        case 'Up':
        case 'ArrowUp':
          e.preventDefault();
          indexToFocus = focusedIndex - 1 < 0 ? values.length - 1 : focusedIndex - 1;
          focus(values[indexToFocus]);
          break;
        case 'Down':
        case 'ArrowDown':
          e.preventDefault();
          indexToFocus = focusedIndex + 1 > values.length - 1 ? 0 : focusedIndex + 1;
          focus(values[indexToFocus]);
          break;
        case 'Spacebar':
        case ' ':
          e.preventDefault();
          if (typeahead !== '') {
            type(' ');
          } else {
            select(activeItem);
          }
          break;
        case 'Enter':
          e.preventDefault();
          select(activeItem);
          break;
        default:
          if (!(isString(e.key) && e.key.length === 1)) {
            return;
          }

          e.preventDefault();
          type(e.key);
      }
    },
    ...props,
  });
}

export function ListboxOption({ children, value, ...props }) {
  const {
    activeItem,
    setData,
    select,
    registerOptionId,
    unregisterOptionId,
    registerOptionRef,
    unregisterOptionRef,
    props: { value: selectedValue },
  } = useListbox();
  const id = useId();
  const isActive = activeItem === value;
  const isSelected = selectedValue === value;
  const listboxOptionRef = useRef(null);
  const oldValue = usePrevious(value);

  useEffect(() => {
    if (value === oldValue) return;

    unregisterOptionId(oldValue);
    unregisterOptionRef(oldValue);
    registerOptionId(value, id);
    registerOptionRef(value, listboxOptionRef);
  }, [value]);

  useEffect(() => {
    registerOptionId(value, id);
    registerOptionRef(value, listboxOptionRef);

    return () => {
      unregisterOptionId(value);
      unregisterOptionRef(value);
    };
  }, []);

  return createElement('li', {
    children:
      typeof children === 'function' ? createElement(children, { isActive, isSelected }) : children,
    ref: listboxOptionRef,
    id,
    role: 'option',
    ...(isSelected
      ? {
          'aria-selected': true,
        }
      : {}),
    onClick: () => select(value),
    onMouseMove: () => {
      if (activeItem === value) {
        return;
      }

      setData((prevData) => ({ ...prevData, activeItem: value }));
    },
    ...props,
  });
}
