import { useNavigate } from "react-router-dom";
import { PlusIcon, ExclamationCircleIcon, CalendarIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";

const isNativePlatform = () => (window as any).Capacitor?.isNativePlatform?.() === true;

export const QuickActions = () => {
  const navigate = useNavigate();

  const hapticFeedback = async () => {
    if (isNativePlatform()) {
      try {
        const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.error('Haptic feedback error:', error);
      }
    }
  };

  const actions = [
    {
      id: 'create-post',
      icon: PlusIcon,
      label: 'Create Post',
      color: 'bg-primary/10 text-primary',
      action: () => {
        hapticFeedback();
        // This would typically open a create post modal
        navigate('/?createPost=true');
      }
    },
    {
      id: 'safety',
      icon: ExclamationCircleIcon,
      label: 'Report Issue',
      color: 'bg-orange-500/10 text-orange-500',
      action: () => {
        hapticFeedback();
        navigate('/safety');
      }
    },
    {
      id: 'events',
      icon: CalendarIcon,
      label: 'Find Events',
      color: 'bg-blue-500/10 text-blue-500',
      action: () => {
        hapticFeedback();
        navigate('/events');
      }
    },
    {
      id: 'marketplace',
      icon: ShoppingBagIcon,
      label: 'Browse Market',
      color: 'bg-green-500/10 text-green-500',
      action: () => {
        hapticFeedback();
        navigate('/marketplace');
      }
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={action.action}
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
          >
            <div className={`p-2.5 rounded-lg ${action.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-foreground text-center leading-tight">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
