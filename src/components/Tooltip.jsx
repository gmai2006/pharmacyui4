export const Tooltip = ({ text, children }) => (
    <div className="relative group inline-block">
        {children}

        <div
            className="
                absolute hidden group-hover:block
                bottom-full left-1/2 -translate-x-1/2 mb-2
                bg-black text-white text-xs rounded px-2 py-1
                whitespace-nowrap shadow-lg z-50
            "
        >
            {text}
        </div>
    </div>
);
