import {
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';
import {
  useNavigate,
  useParams
} from 'react-router-dom';
import {
  useReactToPrint
} from 'react-to-print';
import {
  useQuery,
  useMutation
} from '@apollo/client';
import {
  DocumentNode
} from 'graphql';
import {
  toast
} from 'react-toastify';
import {
  format,
  isToday,
  isYesterday,
  isPast,
  startOfDay
} from 'date-fns';
import {
  useHotkeys
} from 'react-hotkeys-hook';
import {
  useTranslation
} from 'react-i18next';

// Apollo GraphQL Queries & Mutations
import {
  GET_ORDER,
  GET_ORDERS,
  GET_TABLES,
  GET_MENU_ITEMS,
} from '../graphql/queries';
import {
  CREATE_ORDER,
  UPDATE_ORDER,
  DELETE_ORDER,
  ADD_ITEM_TO_ORDER,
  UPDATE_ITEM_IN_ORDER,
  REMOVE_ITEM_FROM_ORDER,
  SET_ORDER_STATUS,
  SET_ORDER_TABLE,
  SPLIT_ORDER,
  MERGE_ORDER,
  ADD_PAYMENT_TO_ORDER,
  VOID_PAYMENT_FROM_ORDER,
} from '../graphql/mutations';

// Components
import OrderItem from '../components/OrderItem';
import PaymentItem from '../components/PaymentItem';
import OrderTotalsDisplay from '../components/OrderTotalsDisplay';
import OrderStatusDropdown from '../components/OrderStatusDropdown';
import TableSelectDropdown from '../components/TableSelectDropdown';
import PaymentDialog from '../components/PaymentDialog';
import SplitOrderDialog from '../components/SplitOrderDialog';
import MergeOrderDialog from '../components/MergeOrderDialog';
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog';
import MenuItemGrid from '../components/MenuItemGrid';
import VoucherDialog from '../components/VoucherDialog';

// Utils
import {
  formatPrice,
  formatTableName,
  getOrderStatusColor,
  calculateOrderTotals,
  calculateTotalsFromPriceStrings,
  OrderTotals,
} from '../lib/orderUtils';

// Types
import {
  OrderItemType,
  PaymentType
} from '../types';

// ========================= COMPONENT =========================
const Orders = () => {
    const {
      id: orderIdParam
    } = useParams();
    const navigate = useNavigate();
    const {
      t
    } = useTranslation();

    // ========================= STATE =========================
    // --- Order Specific ---
    const [orderId, setOrderId] = useState < string | null > (orderIdParam || null);
    const [orderItems, setOrderItems] = useState < OrderItemType[] > ([]);
    const [payments, setPayments] = useState < PaymentType[] > ([]);
    const [orderStatus, setOrderStatus] = useState < string > ('ORDERING');
    const [tableId, setTableId] = useState < string | null > (null);
    const [tipAmount, setTipAmount] = useState < number > (0);
    const [customerNotes, setCustomerNotes] = useState < string > ('');

    // --- UI State ---
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showSplitOrderDialog, setShowSplitOrderDialog] = useState(false);
    const [showMergeOrderDialog, setShowMergeOrderDialog] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [showVoucherDialog, setShowVoucherDialog] = useState(false);
    const [isNewOrder, setIsNewOrder] = useState(false);
    const [isDirty, setIsDirty] = useState(false); // To track unsaved changes
    const [selectedMenuItemId, setSelectedMenuItemId] = useState < string | null > (null);

    // ========================= REFS =========================
    const componentRef = useRef < any > (null);

    // ========================= APOLLO HOOKS =========================
    // --- Queries ---
    const {
      loading: loadingOrder,
      error: errorOrder,
      data: orderData,
      refetch: refetchOrder
    } = useQuery(GET_ORDER, {
      variables: {
        id: orderId
      },
      skip: !orderId,
      fetchPolicy: 'cache-and-network',
    });
    const {
      loading: loadingOrders,
      error: errorOrders,
      data: ordersData
    } = useQuery(GET_ORDERS);
    const {
      loading: loadingTables,
      error: errorTables,
      data: tablesData
    } = useQuery(GET_TABLES);
    const {
      loading: loadingMenuItems,
      error: errorMenuItems,
      data: menuItemsData
    } = useQuery(GET_MENU_ITEMS);

    // --- Mutations ---
    const [createOrderMutation] = useMutation(CREATE_ORDER, {
      refetchQueries: [{
        query: GET_ORDERS
      }],
      awaitRefetchQueries: true,
      onCompleted: (data) => {
        setOrderId(data.createOrder.id);
        navigate(`/orders/${data.createOrder.id}`);
        toast.success(t('order.created'));
      },
      onError: (error) => {
        console.error('Error creating order:', error);
        toast.error(t('order.create_error'));
      },
    });
    const [updateOrderMutation] = useMutation(UPDATE_ORDER, {
      refetchQueries: [{
        query: GET_ORDER,
        variables: {
          id: orderId
        }
      }],
      awaitRefetchQueries: true,
      onCompleted: () => {
        setIsDirty(false); // Reset dirty state on successful save
        toast.success(t('order.updated'));
      },
      onError: (error) => {
        console.error('Error updating order:', error);
        toast.error(t('order.update_error'));
      },
    });
    const [deleteOrderMutation] = useMutation(DELETE_ORDER, {
      refetchQueries: [{
        query: GET_ORDERS
      }],
      awaitRefetchQueries: true,
      onCompleted: () => {
        navigate('/orders');
        toast.success(t('order.deleted'));
      },
      onError: (error) => {
        console.error('Error deleting order:', error);
        toast.error(t('order.delete_error'));
      },
    });
    const [addItemToOrderMutation] = useMutation(ADD_ITEM_TO_ORDER, {
      refetchQueries: [{
        query: GET_ORDER,
        variables: {
          id: orderId
        }
      }],
      awaitRefetchQueries: true,
      onError: (error) => {
        console.error('Error adding item to order:', error);
        toast.error(t('order.add_item_error'));
      },
    });
    const [updateItemInOrderMutation] = useMutation(UPDATE_ITEM_IN_ORDER, {
      refetchQueries: [{
        query: GET_ORDER,
        variables: {
          id: orderId
        }
      }],
      awaitRefetchQueries: true,
      onError: (error) => {
        console.error('Error updating item in order:', error);
        toast.error(t('order.update_item_error'));
      },
    });
    const [removeItemFromOrderMutation] = useMutation(REMOVE_ITEM_FROM_ORDER, {
      refetchQueries: [{
        query: GET_ORDER,
        variables: {
          id: orderId
        }
      }],
      awaitRefetchQueries: true,
      onError: (error) => {
        console.error('Error removing item from order:', error);
        toast.error(t('order.remove_item_error'));
      },
    });
    const [setOrderStatusMutation] = useMutation(SET_ORDER_STATUS, {
      refetchQueries: [{
        query: GET_ORDER,
        variables: {
          id: orderId
        }
      }],
      awaitRefetchQueries: true,
      onError: (error) => {
        console.error('Error setting order status:', error);
        toast.error(t('order.set_status_error'));
      },
    });
    const [setOrderTableMutation] = useMutation(SET_ORDER_TABLE, {
      refetchQueries: [{
        query: GET_ORDER,
        variables: {
          id: orderId
        }
      }],
      awaitRefetchQueries: true,
      onError: (error) => {
        console.error('Error setting order table:', error);
        toast.error(t('order.set_table_error'));
      },
    });
    const [splitOrderMutation] = useMutation(SPLIT_ORDER, {
      refetchQueries: [{
        query: GET_ORDER,
        variables: {
          id: orderId
        }
      }, {
        query: GET_ORDERS
      }],
      awaitRefetchQueries: true,
      onCompleted: () => {
        setShowSplitOrderDialog(false);
        toast.success(t('order.split_success'));
      },
      onError: (error) => {
        console.error('Error splitting order:', error);
        toast.error(t('order.split_error'));
      },
    });
    const [mergeOrderMutation] = useMutation(MERGE_ORDER, {
      refetchQueries: [{
        query: GET_ORDER,
        variables: {
          id: orderId
        }
      }, {
        query: GET_ORDERS
      }],
      awaitRefetchQueries: true,
      onCompleted: () => {
        setShowMergeOrderDialog(false);
        toast.success(t('order.merge_success'));
      },
      onError: (error) => {
        console.error('Error merging order:', error);
        toast.error(t('order.merge_error'));
      },
    });
    const [addPaymentToOrderMutation] = useMutation(ADD_PAYMENT_TO_ORDER, {
      refetchQueries: [{
        query: GET_ORDER,
        variables: {
          id: orderId
        }
      }],
      awaitRefetchQueries: true,
      onCompleted: () => {
        setShowPaymentDialog(false);
        toast.success(t('order.payment_added'));
      },
      onError: (error) => {
        console.error('Error adding payment to order:', error);
        toast.error(t('order.payment_add_error'));
      },
    });
    const [voidPaymentFromOrderMutation] = useMutation(VOID_PAYMENT_FROM_ORDER, {
      refetchQueries: [{
        query: GET_ORDER,
        variables: {
          id: orderId
        }
      }],
      awaitRefetchQueries: true,
      onError: (error) => {
        console.error('Error voiding payment:', error);
        toast.error(t('order.payment_void_error'));
      },
    });

    // ========================= UTILITY FUNCTIONS =========================
    const calculateTotals = useCallback(() => {
      if (!orderId) return {
        subtotal: 0,
        discount: 0,
        serviceCharge: 0,
        tax: 0,
        tip: 0,
        total: 0
      };

      // Use price strings if orderData.order.items exist and their price is a string
      if (orderData?.order?.items && orderData.order.items[0]?.price && typeof orderData.order.items[0].price === 'string') {
        return calculateTotalsFromPriceStrings(orderData.order.items, tipAmount);
      } else {
        return calculateOrderTotals(orderItems, tipAmount);
      }
    }, [orderItems, tipAmount, orderData]);

    // ========================= HANDLERS =========================
    // --- Order Management Handlers ---
    const handleCreateOrder = async () => {
      setIsNewOrder(true);
      await createOrderMutation();
    };

    const handleSaveOrder = async () => {
      if (!orderId) {
        toast.error(t('order.no_id_error'));
        return;
      }

      // Prepare items for saving. If price is a string, convert it to a number.
      const itemsToSave = orderItems.map(item => ({
        id: item.id,
        qty: item.qty,
        name: item.name,
        price: typeof item.price === 'string' ? parseFloat(item.price.replace('$', '')) : item.price,
        itemOrderType: item.itemOrderType,
        noTax: item.noTax || false,
      }));

      await updateOrderMutation({
        variables: {
          id: orderId,
          items: itemsToSave,
          customerNotes: customerNotes,
        },
      });
    };

    const handleDeleteOrder = async () => {
      if (!orderId) {
        toast.error(t('order.no_id_error'));
        return;
      }
      await deleteOrderMutation({
        variables: {
          id: orderId
        }
      });
    };

    const handleAddItemToOrder = async (menuItemId: string) => {
      if (!orderId) {
        toast.error(t('order.no_id_error'));
        return;
      }
      setSelectedMenuItemId(menuItemId);
      const menuItem = menuItemsData?.menuItems.find((item: any) => item.id === menuItemId);

      if (!menuItem) {
        toast.error(t('order.menu_item_not_found'));
        return;
      }

      await addItemToOrderMutation({
        variables: {
          orderId: orderId,
          itemId: menuItemId,
          qty: 1,
          price: menuItem.price,
          name: menuItem.name,
          itemOrderType: 'MENU_ITEM',
          noTax: menuItem.noTax || false,
        },
      });
    };

    const handleUpdateItemQuantity = async (itemId: string, qty: number) => {
      if (!orderId) {
        toast.error(t('order.no_id_error'));
        return;
      }
      setIsDirty(true); // Mark order as dirty
      await updateItemInOrderMutation({
        variables: {
          orderId: orderId,
          itemId: itemId,
          qty: qty,
        },
      });
    };

    const handleRemoveItemFromOrder = async (itemId: string) => {
      if (!orderId) {
        toast.error(t('order.no_id_error'));
        return;
      }
      setIsDirty(true); // Mark order as dirty
      await removeItemFromOrderMutation({
        variables: {
          orderId: orderId,
          itemId: itemId,
        },
      });
    };

    const handleOrderStatusChange = async (newStatus: string) => {
      if (!orderId) {
        toast.error(t('order.no_id_error'));
        return;
      }
      await setOrderStatusMutation({
        variables: {
          id: orderId,
          status: newStatus,
        },
      });
    };

    const handleTableSelect = async (tableId: string | null) => {
      if (!orderId) {
        toast.error(t('order.no_id_error'));
        return;
      }
      await setOrderTableMutation({
        variables: {
          id: orderId,
          tableId: tableId,
        },
      });
    };

    const handleAddPayment = async (payment: PaymentType) => {
      if (!orderId) {
        toast.error(t('order.no_id_error'));
        return;
      }
      await addPaymentToOrderMutation({
        variables: {
          orderId: orderId,
          amount: payment.amount,
          paymentType: payment.paymentType,
        },
      });
    };

    const handleVoidPayment = async (paymentId: string) => {
      if (!orderId) {
        toast.error(t('order.no_id_error'));
        return;
      }
      await voidPaymentFromOrderMutation({
        variables: {
          orderId: orderId,
          paymentId: paymentId,
        },
      });
    };

    // --- Printing Functionality ---
    const handlePrint = useReactToPrint({
      content: () => componentRef.current,
      pageStyle: `@page { size: auto; margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact !important; padding: 10mm !important; } }`,
    });

    // ========================= HOTKEYS =========================
    useHotkeys('ctrl+s, command+s', (event) => {
      event.preventDefault();
      if (isDirty) {
        handleSaveOrder();
      }
    }, {
      enableOnTags: ['INPUT', 'TEXTAREA'],
    });
    useHotkeys('ctrl+p, command+p', (event) => {
      event.preventDefault();
      handlePrint();
    }, {
      enableOnTags: ['INPUT', 'TEXTAREA'],
    });

    // ========================= USE EFFECT HOOKS =========================
    useEffect(() => {
      if (orderData && orderData.order) {
        // Convert price to number if it's a string
        const items = orderData.order.items.map((item: any) => ({
          ...item,
          price: typeof item.price === 'string' ? parseFloat(item.price.replace('$', '')) : item.price,
        }));
        setOrderItems(items);
        setOrderStatus(orderData.order.status);
        setTableId(orderData.order.tableId);
        setPayments(orderData.order.payments);
        setTipAmount(orderData.order.tip);
        setCustomerNotes(orderData.order.customerNotes);
        setIsNewOrder(false);
      }
    }, [orderData]);

    useEffect(() => {
      if (isNewOrder) {
        handleCreateOrder();
      }
    }, [isNewOrder, handleCreateOrder]);

    useEffect(() => {
      if (orderIdParam) {
        setOrderId(orderIdParam);
      }
    }, [orderIdParam]);

    // ========================= RENDER =========================
    if (loadingOrder || loadingOrders || loadingTables || loadingMenuItems) return < div > {
      t('loading')
    } ... < /div>;
    if (errorOrder || errorOrders || errorTables || errorMenuItems) return < div > {
      t('error')
    } < /div>;

    const tables = tablesData?.tables || [];
    const menuItems = menuItemsData?.menuItems || [];
    const orders = ordersData?.orders || [];

    const totals = calculateTotals();

    return ( <
      div className = "flex h-screen bg-gray-100" >
      {/* Sidebar (Order List) */ } <
      aside className = "w-80 bg-gray-200 p-4 border-r border-gray-300" >
      <
      h2 className = "text-lg font-semibold mb-2" > {
        t('order.order_list')
      } < /h2> <
      button onClick = {
        () => setIsNewOrder(true)
      }
      className = "bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4" >
      {
        t('order.new_order')
      } <
      /button> <
      ul className = "space-y-2" > {
        orders.map((order: any) => ( <
          li key = {
            order.id
          }
          className = "bg-white p-2 rounded shadow-sm hover:bg-gray-100 cursor-pointer"
          onClick = {
            () => navigate(`/orders/${order.id}`)
          } >
          <
          div className = "flex justify-between items-center" >
          <
          span className = "font-medium" > {
            t('order.order')
          } # {
            order.id
          } < /span> <
          span className = {
            `text-sm ${getOrderStatusColor(order.status)}`
          } > {
            t(`order.status_options.${order.status.toLowerCase()}`)
          } <
          /span> <
          /div> <
          div className = "text-sm text-gray-500" >
          {
            order.tableId ? `${t('order.table')}: ${formatTableName(order.tableId)}` : t('order.no_table')
          }
          <
          /div> <
          /li>
        ))
      } <
      /ul> <
      /aside>

      {/* Main Content */ } <
      main className = "flex-1 flex flex-col" >
      {/* Order Header */ } <
      header className = "bg-white p-4 border-b border-gray-300 flex items-center justify-between" >
      <
      div >
      <
      h1 className = "text-xl font-semibold" > {
        orderId ? `${t('order.order')} #${orderId}` : t('order.new_order')
      } < /h1> <
      div className = "text-sm text-gray-500" >
      {
        orderData?.order?.createdAt && ( <
          span >
          {
            t('order.created_at')
          }: {
            format(new Date(orderData.order.createdAt), 'PPP p')
          } {
            isToday(new Date(orderData.order.createdAt)) ? `(${t('today')})` : ''
          } {
            isYesterday(new Date(orderData.order.createdAt)) ? `(${t('yesterday')})` : ''
          } {
            isPast(new Date(orderData.order.createdAt)) ? '' : ''
          } <
          /span>
        )
      } <
      /div> <
      /div>

      <
      div className = "flex items-center space-x-4" >
      <
      OrderStatusDropdown status = {
        orderStatus
      }
      onStatusChange = {
        handleOrderStatusChange
      }
      /> <
      TableSelectDropdown selectedTable = {
        tableId
      }
      tables = {
        tables
      }
      onTableSelect = {
        handleTableSelect
      }
      /> <
      button onClick = {
        handlePrint
      }
      className = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" >
      {
        t('order.print')
      } <
      /button> <
      button onClick = {
        handleSaveOrder
      }
      className = {
        `bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${!isDirty ? 'opacity-50 cursor-not-allowed' : ''}`
      }
      disabled = {!isDirty
      } >
      {
        t('order.save')
      } <
      /button> <
      button onClick = {
        () => setShowDeleteConfirmation(true)
      }
      className = "bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" >
      {
        t('order.delete')
      } <
      /button> <
      /div> <
      /header>

      {/* Order Content */ } <
      div className = "flex-1 flex p-4" >
      {/* Order Items */ } <
      div className = "w-2/3 pr-4" >
      <
      h2 className = "text-lg font-semibold mb-2" > {
        t('order.order_items')
      } < /h2> <
      div className = "space-y-2" > {
        orderItems.map((item) => ( <
          OrderItem key = {
            item.id
          }
          item = {
            item
          }
          onQuantityChange = {
            handleUpdateItemQuantity
          }
          onRemove = {
            handleRemoveItemFromOrder
          }
          />
        ))
      } <
      /div>

      <
      div className = "flex justify-between items-center mt-4" >
      <
      button onClick = {
        () => setShowVoucherDialog(true)
      }
      className = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" >
      {
        t('order.add_voucher')
      } <
      /button> <
      div className = "flex space-x-2" >
      <
      button onClick = {
        () => setShowSplitOrderDialog(true)
      }
      className = "bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded" >
      {
        t('order.split_order')
      } <
      /button> <
      button onClick = {
        () => setShowMergeOrderDialog(true)
      }
      className = "bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded" >
      {
        t('order.merge_order')
      } <
      /button> <
      /div> <
      /div>

      <
      label htmlFor = "customerNotes"
      className = "block text-sm font-medium text-gray-700 mt-4" > {
        t('order.customer_notes')
      } <
      /label> <
      textarea id = "customerNotes"
      rows = {
        3
      }
      className = "shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
      value = {
        customerNotes
      }
      onChange = {
        (e) => {
          setCustomerNotes(e.target.value);
          setIsDirty(true); // Mark order as dirty
        }
      }
      /> <
      /div>

      {/* Order Summary */ } <
      div className = "w-1/3 pl-4" >
      <
      h2 className = "text-lg font-semibold mb-2" > {
        t('order.order_summary')
      } < /h2> <
      OrderTotalsDisplay totals = {
        totals
      }
      tipAmount = {
        tipAmount
      }
      onTipChange = {
        (value) => {
          setTipAmount(value);
          setIsDirty(true); // Mark order as dirty
        }
      }
      />

      <
      h3 className = "text-md font-semibold mt-4 mb-2" > {
        t('order.payments')
      } < /h3> <
      div className = "space-y-2" > {
        payments.map((payment) => ( <
          PaymentItem key = {
            payment.id
          }
          payment = {
            payment
          }
          onVoid = {
            handleVoidPayment
          }
          />
        ))
      } <
      /div>

      <
      button onClick = {
        () => setShowPaymentDialog(true)
      }
      className = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4 w-full" >
      {
        t('order.add_payment')
      } <
      /button> <
      /div> <
      /div>

      {/* Menu Items */ } <
      div className = "bg-gray-200 p-4 border-t border-gray-300" >
      <
      h2 className = "text-lg font-semibold mb-2" > {
        t('order.menu_items')
      } < /h2> <
      MenuItemGrid items = {
        menuItems
      }
      onItemClick = {
        handleAddItemToOrder
      }
      /> <
      /div> <
      /main>

      {/* Hidden Print View */ } <
      div style = {
        {
          display: 'none'
        }
      } >
      <
      div ref = {
        componentRef
      }
      className = "p-4" >
      <
      h1 className = "text-xl font-semibold mb-2" > {
        t('order.order')
      } #{
        orderId
      } < /h1> <
      p > {
        t('order.date')
      }: {
        new Date().toLocaleDateString()
      } < /p> <
      p > {
        t('order.status')
      }: {
        t(`order.status_options.${orderStatus.toLowerCase()}`)
      } < /p> <
      h2 className = "text-lg font-semibold mt-4 mb-2" > {
        t('order.items')
      } < /h2> <
      ul className = "list-disc ml-5" > {
        orderItems.map((item) => ( <
          li key = {
            item.id
          } > {
            item.qty
          } x {
            item.name
          } - {
            formatPrice(item.price * item.qty)
          } < /li>
        ))
      } <
      /ul> <
      h2 className = "text-lg font-semibold mt-4 mb-2" > {
        t('order.payments')
      } < /h2> <
      ul className = "list-disc ml-5" > {
        payments.map((payment) => ( <
          li key = {
            payment.id
          } > {
            payment.paymentType
          }: {
            formatPrice(payment.amount)
          } < /li>
        ))
      } <
      /ul> <
      OrderTotalsDisplay totals = {
        totals
      }
      tipAmount = {
        tipAmount
      }
      /> <
      p className = "mt-4" > {
        t('order.customer_notes')
      }: {
        customerNotes
      } < /p> <
      /div> <
      /div>

      {/* Payment Dialog */ } <
      PaymentDialog isOpen = {
        showPaymentDialog
      }
      onClose = {
        () => setShowPaymentDialog(false)
      }
      onAddPayment = {
        handleAddPayment
      }
      />

      {/* Split Order Dialog */ } <
      SplitOrderDialog isOpen = {
        showSplitOrderDialog
      }
      onClose = {
        () => setShowSplitOrderDialog(false)
      }
      orderItems = {
        orderItems
      }
      orderId = {
        orderId || ''
      }
      splitOrderMutation = {
        splitOrderMutation
      }
      />

      {/* Merge Order Dialog */ } <
      MergeOrderDialog isOpen = {
        showMergeOrderDialog
      }
      onClose = {
        () => setShowMergeOrderDialog(false)
      }
      orders = {
        orders
      }
      currentOrderId = {
        orderId || ''
      }
      mergeOrderMutation = {
        mergeOrderMutation
      }
      />

      {/* Delete Confirmation Dialog */ } <
      DeleteConfirmationDialog isOpen = {
        showDeleteConfirmation
      }
      onClose = {
        () => setShowDeleteConfirmation(false)
      }
      onDelete = {
        handleDeleteOrder
      }
      />

      {/* Voucher Dialog */ } <
      VoucherDialog isOpen = {
        showVoucherDialog
      }
      onClose = {
        () => setShowVoucherDialog(false)
      }
      onAddVoucher = {
        (amount, voucherData) => {
          const sellingPrice = voucherData.sellingPrice || amount;
          const label = voucherData.type === 'percentage' ?
            `Voucher – ${amount}%` :
            `Voucher - $${amount.toFixed(2)}`;

          setOrderItems((prev) => [...prev, {
            id: Date.now(),
            qty: voucherData.quantity || 1,
            name: label,
            price: sellingPrice,
            itemOrderType: 'VOUCHER',
            noTax: true
          }]);
          setShowVoucherDialog(false);
        }
      }
      /> <
      /div>
    );
  };

  export default Orders;
