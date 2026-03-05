import * as React from 'react';
import SvgIcon, { SvgIconProps } from '@mui/material/SvgIcon';

/**
 * Messenger Icon (Lightning bolt speech bubble)
 * SVG Path inspired by the official Messenger logo
 */
export function MessengerIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props} viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.51 3.734 7.243V22l3.374-1.85a11.121 11.121 0 002.892.38c5.523 0 10-4.146 10-9.258S17.523 2 12 2zm1.293 11.968l-2.586-2.758-5.06 2.758 5.564-5.914 2.586 2.758 5.06-2.758-5.564 5.914z" />
        </SvgIcon>
    );
}
