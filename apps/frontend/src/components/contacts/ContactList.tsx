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
      <Box className='bg-card'>
        {loading ? (
          <Box className='flex items-center justify-center p-10'>
            <CircularProgress size={24} />
          </Box>
        ) : contacts.length === 0 ? (
          <Box className='p-6 text-center text-sm text-muted-foreground'>No contacts found.</Box>
        ) : (
          <List disablePadding>
            {contacts.map((c, idx) => (
              <Box key={c.id}>
                <ListItemButton onClick={() => onSelect(c)} className='flex items-center hover:bg-muted/50'>
                  <div className='flex w-full items-center justify-between gap-4'>
                    <ListItemText
                      primary={<span className='text-foreground font-medium'>{fullName(c)}</span>}
                      secondary={
                        <span className='text-muted-foreground'>
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
                        className='inline-flex items-center rounded-md bg-card px-2.5 py-1.5 text-xs font-medium text-primary shadow-sm ring-1 ring-inset ring-border hover:bg-muted'
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
                          className='inline-flex items-center rounded-md bg-card px-2.5 py-1.5 text-xs font-medium text-destructive shadow-sm ring-1 ring-inset ring-border hover:bg-destructive/10'
                        >
                          Delete
                        </button>
                      ) : null}
                    </Stack>
                  </div>
                </ListItemButton>
                {idx < contacts.length - 1 ? <Divider component='li' className='border-border' /> : null}
              </Box>
            ))}
          </List>
        )}
      </Box>

      <Box className='flex justify-center py-4 border-t border-border'>
        <Pagination count={pageCount} page={page} onChange={(_, p) => onPageChange(p)} color='primary' size='small' />
      </Box>
    </Box>
  );
}
