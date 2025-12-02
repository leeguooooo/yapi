import React from 'react';
import {
  ApiOutlined,
  AppstoreAddOutlined,
  AppstoreOutlined,
  BarsOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  CopyOutlined,
  DashOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileOutlined,
  FileUnknownOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  FormOutlined,
  IdcardOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  LockOutlined,
  LogoutOutlined,
  MailOutlined,
  MinusCircleOutlined,
  MinusOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  SnippetsOutlined,
  StarFilled,
  StarOutlined,
  TeamOutlined,
  UnlockOutlined,
  UserOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Form as AntForm } from 'antd';

const ICON_MAP = {
  api: ApiOutlined,
  'appstore-o': AppstoreOutlined,
  bars: BarsOutlined,
  card: IdcardOutlined,
  case: SnippetsOutlined,
  check: CheckOutlined,
  'check-circle': CheckCircleOutlined,
  close: CloseOutlined,
  copy: CopyOutlined,
  danger: CloseCircleOutlined,
  dashed: DashOutlined,
  database: DatabaseOutlined,
  delete: DeleteOutlined,
  down: DownOutlined,
  edit: EditOutlined,
  'exclamation-circle': ExclamationCircleOutlined,
  'exclamation-circle-o': ExclamationCircleOutlined,
  'eye-o': EyeOutlined,
  file: FileOutlined,
  flex: AppstoreOutlined,
  folder: FolderOutlined,
  'folder-add': FolderAddOutlined,
  'folder-open': FolderOpenOutlined,
  inbox: InboxOutlined,
  info: InfoCircleOutlined,
  'info-circle': InfoCircleOutlined,
  inter: ApiOutlined,
  lock: LockOutlined,
  logout: LogoutOutlined,
  mail: MailOutlined,
  matrix: AppstoreOutlined,
  'minus-circle-o': MinusCircleOutlined,
  module: AppstoreAddOutlined,
  monotone: AppstoreOutlined,
  noChange: MinusOutlined,
  noData: FileUnknownOutlined,
  noFollow: FileUnknownOutlined,
  noMemberInGroup: TeamOutlined,
  noMemberInProject: TeamOutlined,
  noProject: AppstoreOutlined,
  password: KeyOutlined,
  plus: PlusOutlined,
  'plus-circle': PlusCircleOutlined,
  primary: CheckCircleOutlined,
  'question-circle': QuestionCircleOutlined,
  'question-circle-o': QuestionCircleOutlined,
  reload: ReloadOutlined,
  search: SearchOutlined,
  star: StarFilled,
  'star-o': StarOutlined,
  team: TeamOutlined,
  textarea: FormOutlined,
  unlock: UnlockOutlined,
  user: UserOutlined,
  warning: WarningOutlined
};

export function Icon({ type, ...rest }) {
  const normalized = type && ICON_MAP[type];
  const fallback = type && type.endsWith('-o') ? ICON_MAP[type.replace(/-o$/, '')] : null;
  const Comp = normalized || fallback || QuestionCircleOutlined;
  return <Comp {...rest} />;
}

// Provide a minimal Form shim; most code now uses LegacyForm for create().
const Form = AntForm;
if (!Form.create) {
  Form.create = () => WrappedComponent => WrappedComponent;
}

export { Form };
export default { Icon, Form };
