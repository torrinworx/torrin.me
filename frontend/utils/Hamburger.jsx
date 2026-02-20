import { Detached, Button, Icon, Observer, useAbort } from '@destamatic/ui';
import Paper from './Paper.jsx';

const Hamburger = ({
    children,
    trigger,
    paperTheme = 'column_tight_center',
}) => {
    const focused = Observer.mutable(false);

    const close = () => focused.set(false);
    const toggle = () => focused.set(!focused.get());

    const Reposition = (_, cleanup) => {
        cleanup(focused.effect(v => {
            if (!v) return;

            return useAbort(signal => {
                const kick = () => {
                    const cur = focused.get();
                    if (cur === true || typeof cur === 'number') focused.set(true);
                };

                window.addEventListener('resize', kick, { signal });
                window.addEventListener('scroll', kick, { signal, passive: true });

                // close on escape
                window.addEventListener('keydown', e => {
                    if (e.key === 'Escape') close();
                }, { signal });
            })();
        }));

        return null;
    };

    return <Detached
        enabled={focused}
        locations={[
            Detached.BOTTOM_RIGHT_LEFT,
            Detached.BOTTOM_LEFT_RIGHT,
            Detached.TOP_RIGHT_LEFT,
            Detached.TOP_LEFT_RIGHT,
        ]}
        style={{
            overflow: 'auto',
            boxSizing: 'border-box',
            maxWidth: 'calc(100vw - 10px)',
            maxHeight: 'calc(100vh - 10px)',
        }}
    >
        <Reposition />

        <mark:anchor>
            {trigger
                ? (typeof trigger === 'function'
                    ? trigger({ focused, close, toggle })
                    : trigger)
                : <Button
                    type='text'
                    title='Menu'
                    onClick={toggle}
                    icon={<Icon name='feather:menu' />}
                />
            }
        </mark:anchor>

        <mark:popup>
            <Paper
                theme={paperTheme}
                style={{
                    padding: 10,
                    gap: 10,
                    boxSizing: 'border-box',
                    minWidth: 0,
                }}
                onPointerDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
            >
                {children}
            </Paper>
        </mark:popup>
    </Detached>;
};

export default Hamburger;
