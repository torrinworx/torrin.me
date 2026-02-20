import { createContext } from '@destamatic/ui';

const AppContext = createContext(null, (raw) => raw);

export default AppContext;
