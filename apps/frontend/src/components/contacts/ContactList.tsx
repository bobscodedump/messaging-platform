import type { CreateContactDto } from 'shared-types';
import { Box, List, ListItemButton, ListItemText, Divider, Stack, CircularProgress, Pagination } from '@mui/material';

export type ContactListItem = Partial<CreateContactDto> & { id: string };

export type ContactListProps = {
  contacts: ContactListItem[];
  page: number;
  pageSize: number;
  total: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onSelect: (contact: ContactListItem) => void;
  onDelete?: (contact: ContactListItem) => void;
  className?: string;
};

function fullName(c: Partial<CreateContactDto>) {
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed contact';
}

export default function ContactList({
  contacts,
  page,
  pageSize,
  total,
  loading,
  onPageChange,
  onSelect,
  onDelete,
  className,
}: ContactListProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Box className={className}>
      <Box className='rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'>
        {loading ? (
          <Box className='flex items-center justify-center p-10'>
            <CircularProgress size={24} />
          </Box>
        ) : contacts.length === 0 ? (
          <Box className='p-6 text-center text-sm text-neutral-500'>No contacts found.</Box>
        ) : (
          <List disablePadding>
            {contacts.map((c, idx) => (
              <>
                <ListItemButton key={c.id} onClick={() => onSelect(c)} className='flex items-center'>
                  <div className='flex w-full items-center justify-between gap-4'>
                    <ListItemText
                      primary={<span className='text-neutral-900 dark:text-neutral-100'>{fullName(c)}</span>}
                      secondary={
                        <span className='text-neutral-600 dark:text-neutral-400'>
                          {[c.phoneNumber, c.email].filter(Boolean).join(' • ')}
                        </span>
                      }
                    />
                    <Stack direction='row' spacing={1} className='shrink-0'>
                      <button
                        type='button'
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(c);
                        }}
                        className='inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 shadow-sm ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50 dark:bg-white/90 dark:text-indigo-600'
                      >
                        View data
                      </button>
                      {onDelete ? (
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(c);
                          }}
                          className='inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-medium text-red-700 shadow-sm ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50 dark:bg-white/90 dark:text-red-600'
                        >
                          Delete
                        </button>
                      ) : null}
                    </Stack>
                  </div>
                </ListItemButton>
                {idx < contacts.length - 1 ? <Divider component='li' /> : null}
              </>
            ))}
          </List>
        )}
      </Box>

      <Box className='flex justify-center py-4'>
        <Pagination count={pageCount} page={page} onChange={(_, p) => onPageChange(p)} color='primary' size='small' />
      </Box>
    </Box>
  );
}
