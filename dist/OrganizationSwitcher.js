import { defineComponent, ref, onMounted, onUnmounted, h } from 'vue';
import { useAuth } from './useAuth.js';
export const OrganizationSwitcher = defineComponent({
    name: 'OrganizationSwitcher',
    props: {
        class: { type: String, default: '' },
    },
    setup(props) {
        const { organization, organizations, switchOrganization } = useAuth();
        const isOpen = ref(false);
        const dropdownRef = ref(null);
        function handleClickOutside(event) {
            if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
                isOpen.value = false;
            }
        }
        onMounted(() => {
            document.addEventListener('mousedown', handleClickOutside);
        });
        onUnmounted(() => {
            document.removeEventListener('mousedown', handleClickOutside);
        });
        return () => {
            if (organizations.length <= 1) {
                return h('div', { class: props.class }, [
                    h('span', null, organization?.name || 'No organization'),
                ]);
            }
            return h('div', { ref: dropdownRef, class: `relative ${props.class}` }, [
                h('button', {
                    onClick: () => { isOpen.value = !isOpen.value; },
                    class: 'flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                }, [
                    h('span', { class: 'font-medium' }, organization?.name || 'Select org'),
                    h('svg', {
                        class: `w-4 h-4 transition-transform ${isOpen.value ? 'rotate-180' : ''}`,
                        fill: 'none',
                        viewBox: '0 0 24 24',
                        stroke: 'currentColor',
                    }, [
                        h('path', {
                            'stroke-linecap': 'round',
                            'stroke-linejoin': 'round',
                            'stroke-width': '2',
                            d: 'M19 9l-7 7-7-7',
                        }),
                    ]),
                ]),
                isOpen.value
                    ? h('div', {
                        class: 'absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50',
                    }, [
                        h('div', { class: 'py-1' }, organizations.map((org) => h('button', {
                            key: org.id,
                            onClick: () => {
                                switchOrganization(org.id);
                                isOpen.value = false;
                            },
                            class: `w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${org.id === organization?.id
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300'}`,
                        }, [
                            h('div', { class: 'font-medium' }, org.name),
                            h('div', { class: 'text-xs text-gray-400' }, org.slug),
                        ]))),
                    ])
                    : null,
            ]);
        };
    },
});
//# sourceMappingURL=OrganizationSwitcher.js.map